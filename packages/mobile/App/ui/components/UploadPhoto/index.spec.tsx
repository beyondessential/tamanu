import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Popup } from 'popup-ui';
import { useNetInfo } from '@react-native-community/netinfo';

import { BLOB_TIERS } from '@tamanu/constants';

import { Database } from '~/infra/db';
import { useBackend } from '~/ui/hooks';
import { Attachment } from '~/models/Attachment';
import { BlobAwaitingUploadError } from '~/services/blobs/BlobTransferChannel';
import { MobileBlobCache } from '~/services/blobs/MobileBlobCache';
import { MobileBlobStore } from '~/services/blobs/MobileBlobStore';
import { deriveFreeDiskReserveBytes } from '~/services/blobs/deviceStorage';
import { FakeBlobFileSystem, sha256Hash } from '/root/tests/helpers/fakeBlobFileSystem';
import { getImageFromCamera, resizeImage } from '/helpers/image';
import { UploadPhoto } from './index';

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: { DocumentDirectoryPath: '/documents' },
}));

jest.mock('popup-ui', () => ({ Popup: { show: jest.fn(), hide: jest.fn() } }));

jest.mock('@react-native-community/netinfo', () => ({ useNetInfo: jest.fn() }));

jest.mock('/helpers/file', () => ({ deleteFileInDocuments: jest.fn(async () => {}) }));

jest.mock('/helpers/image', () => ({
  getImageFromCamera: jest.fn(),
  getImageFromPhotoLibrary: jest.fn(),
  imageToBase64URI: (image: string): string => `data:image/jpeg;base64, ${image}`,
  resizeImage: jest.fn(),
}));

jest.mock('~/ui/hooks', () => ({ useBackend: jest.fn() }));

const ROOT = '/blobs';
const RESIZED_PATH = '/documents/resized.jpg';
const HELD_PATH = '/documents/held.jpg';
const FETCHED_PATH = '/documents/fetched.jpg';
const PHOTO_BYTES = 'the captured photograph';
const PHOTO_HASH = sha256Hash(PHOTO_BYTES);
const PHOTO_URI = `data:image/jpeg;base64, ${Buffer.from(PHOTO_BYTES).toString('base64')}`;
const CAPTURED_IMAGE = { base64: 'Y2FwdHVyZWQ=', uri: 'file:///documents/original.jpg' };

const displayedImageUri = (container): string | undefined =>
  container.queryAll(node => node.type === 'Image')[0]?.props?.source?.uri;

describe('<UploadPhoto />', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;
  let cache: MobileBlobCache;
  let onChange: jest.Mock;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await Database.models.Attachment.getRepository().clear();
    await Database.models.Blob.getRepository().clear();

    fs = new FakeBlobFileSystem();
    store = new MobileBlobStore({
      root: ROOT,
      models: Database.models,
      getFreeDiskReserveBytes: deriveFreeDiskReserveBytes,
      evictCache: bytesNeeded => cache.evictBytes(bytesNeeded),
      fs,
    });
    cache = new MobileBlobCache({ blobStore: store, models: Database.models, fs });

    onChange = jest.fn();
    (useBackend as jest.Mock).mockReturnValue({ models: Database.models, blobCache: cache });
    (useNetInfo as jest.Mock).mockReturnValue({ isInternetReachable: true });
    (getImageFromCamera as jest.Mock).mockResolvedValue(CAPTURED_IMAGE);
    (resizeImage as jest.Mock).mockResolvedValue({ path: RESIZED_PATH });
    fs.seed(RESIZED_PATH, PHOTO_BYTES);
  });

  // verifies spec: MOB, CACHE — capture admits to the outbox tier and the
  // record carries the hash and the admitted size, never the bytes or a
  // pointer to a file outside the store
  it('stores a captured photo in the outbox and records only its hash and size', async () => {
    const { getByText } = await render(<UploadPhoto onChange={onChange} value={null} />);

    await takePhoto(getByText);
    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const [attachmentId] = onChange.mock.calls[0];
    const attachment = await Database.models.Attachment.findOne({ where: { id: attachmentId } });
    expect(attachment.hash).toBe(PHOTO_HASH);
    expect(Number(attachment.size)).toBe(PHOTO_BYTES.length);
    expect(attachment.filePath).toBeNull();

    const blob = await Database.models.Blob.findOne({ where: { hash: PHOTO_HASH } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
    expect(fs.contentsOf(store.pathFor(PHOTO_HASH)).toString()).toBe(PHOTO_BYTES);
    expect(fs.contentsOf(RESIZED_PATH)).toBeUndefined();
  });

  // verifies spec: MOB, CAP — a capture the store cannot admit names the
  // device's storage as the cause and leaves nothing behind
  it('shows the device-storage message and creates no attachment when the store is full', async () => {
    fs.freeSpace = 1024 ** 2;

    const { getByText, queryByText } = await render(
      <UploadPhoto onChange={onChange} value={null} />,
    );

    await takePhoto(getByText);
    await waitFor(() => expect(Popup.show).toHaveBeenCalled());

    const [popup] = (Popup.show as jest.Mock).mock.calls[0];
    expect(popup.title).toMatch(/storage space on this device/i);
    expect(popup.textBody).toMatch(/free up space on the device/i);
    expect(queryByText(/Error loading image/)).toBeNull();

    expect(await Database.models.Attachment.getRepository().count()).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  // verifies spec: MOB — a read resolves the record's hash against the device's
  // store, so an answer that already holds a photo shows it and can drop it
  it('shows a photo the answer already holds and offers to remove it', async () => {
    const attachment = await holdPhotoOnDevice();

    const { container, getByText, queryByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );

    await waitFor(() => expect(displayedImageUri(container)).toBe(PHOTO_URI));
    expect(getByText('Remove photo')).toBeTruthy();
    expect(getByText('Change photo')).toBeTruthy();
    expect(queryByText('Upload photo')).toBeNull();
  });

  // verifies spec: MOB — content the device does not hold is fetched by hash
  // and admitted to the cache tier
  it('fetches a photo the device does not hold', async () => {
    const attachment = await seedAttachment();
    cache.setTransferChannel({
      fetchFromCentral: jest.fn(async () => {
        fs.seed(FETCHED_PATH, PHOTO_BYTES);
        return await store.putFile(FETCHED_PATH);
      }),
    } as any);

    const { container } = await render(<UploadPhoto onChange={onChange} value={attachment.id} />);

    await waitFor(() => expect(displayedImageUri(container)).toBe(PHOTO_URI));
    const blob = await Database.models.Blob.findOne({ where: { hash: PHOTO_HASH } });
    expect(blob.tier).toBe(BLOB_TIERS.CACHE);
  });

  // verifies spec: MOB, XFER — content pending at its origin presents as a
  // photo awaiting its content, never as an answer with no photo
  it('reports a photo still awaiting upload from the device that captured it', async () => {
    const attachment = await seedAttachment();
    cache.setTransferChannel({
      fetchFromCentral: jest.fn(async () => {
        throw new BlobAwaitingUploadError(PHOTO_HASH);
      }),
    } as any);

    const { getByText, queryByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );

    await waitFor(() =>
      expect(getByText(/has not finished uploading from the device that captured it/)).toBeTruthy(),
    );
    expect(getByText('Remove photo')).toBeTruthy();
    expect(queryByText('Upload photo')).toBeNull();
  });

  // verifies spec: MOB — content this device has not fetched is distinct from
  // content pending at its origin, and neither reads as a missing photo
  it('reports a photo not on this device when there is no connectivity', async () => {
    (useNetInfo as jest.Mock).mockReturnValue({ isInternetReachable: false });
    const attachment = await seedAttachment();

    const { getByText, queryByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );

    await waitFor(() => expect(getByText(/is not on this device yet/)).toBeTruthy());
    expect(getByText(/Connect to the internet to fetch it/)).toBeTruthy();
    expect(getByText('Remove photo')).toBeTruthy();
    expect(queryByText('Upload photo')).toBeNull();
  });

  // verifies spec: MOB, CACHE — a removed photo's blob has no referencing
  // record left, so it can never become eligible for push
  it("demotes the removed photo's blob to reclaimable cache", async () => {
    const attachment = await holdPhotoOnDevice();

    const { container, getByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );
    await waitFor(() => expect(displayedImageUri(container)).toBe(PHOTO_URI));
    await removePhoto(getByText);

    expect(onChange).toHaveBeenCalledWith(null);
    expect(await Database.models.Attachment.findOne({ where: { id: attachment.id } })).toBeNull();
    const blob = await Database.models.Blob.findOne({ where: { hash: PHOTO_HASH } });
    expect(blob.tier).toBe(BLOB_TIERS.CACHE);
  });

  // verifies spec: MOB, CACHE — content addressing lets two attachments share
  // one blob, so demoting on the first removal would make content another
  // record still references evictable before it has been pushed
  it('leaves the blob in the outbox while another attachment references its hash', async () => {
    const attachment = await holdPhotoOnDevice();
    const sharer = await seedAttachment();

    const { container, getByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );
    await waitFor(() => expect(displayedImageUri(container)).toBe(PHOTO_URI));
    await removePhoto(getByText);

    expect(await Database.models.Attachment.findOne({ where: { id: attachment.id } })).toBeNull();
    expect(await Database.models.Attachment.findOne({ where: { id: sharer.id } })).not.toBeNull();
    const blob = await Database.models.Blob.findOne({ where: { hash: PHOTO_HASH } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
  });

  // A fetch that lands after the photo is removed must not put it back on
  // screen, since the record it belonged to is gone.
  it('discards content that arrives after the photo is removed', async () => {
    let releaseFetch: () => void;
    const fetchReleased = new Promise<void>(resolve => {
      releaseFetch = resolve;
    });
    const attachment = await seedAttachment();
    cache.setTransferChannel({
      fetchFromCentral: jest.fn(async () => {
        await fetchReleased;
        fs.seed(FETCHED_PATH, PHOTO_BYTES);
        return await store.putFile(FETCHED_PATH);
      }),
    } as any);

    const read = jest.spyOn(cache, 'readBase64');

    const { container, getByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );
    await removePhoto(getByText);
    await act(async () => {
      releaseFetch();
      await read.mock.results[0].value;
    });

    expect(displayedImageUri(container)).toBeUndefined();
    expect(getByText('Upload photo')).toBeTruthy();
  });

  async function seedAttachment(): Promise<Attachment> {
    return await Database.models.Attachment.createAndSaveOne<Attachment>({
      hash: PHOTO_HASH,
      size: PHOTO_BYTES.length,
      type: 'image/jpeg',
    });
  }

  async function holdPhotoOnDevice(): Promise<Attachment> {
    fs.seed(HELD_PATH, PHOTO_BYTES);
    await cache.putOutbox(HELD_PATH);
    return await seedAttachment();
  }

  async function takePhoto(getByText): Promise<void> {
    await act(async () => {
      await fireEvent.press(getByText('Take photo with camera'));
    });
  }

  async function removePhoto(getByText): Promise<void> {
    await act(async () => {
      await fireEvent.press(getByText('Remove photo'));
    });
  }
});
