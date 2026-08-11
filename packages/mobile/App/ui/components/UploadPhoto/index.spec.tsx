import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Popup } from 'popup-ui';

import { BLOB_TIERS } from '@tamanu/constants';

import { Database } from '~/infra/db';
import { useBackend } from '~/ui/hooks';
import { Attachment } from '~/models/Attachment';
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
const PHOTO_BYTES = 'the captured photograph';
const PHOTO_HASH = sha256Hash(PHOTO_BYTES);
const CAPTURED_IMAGE = { base64: 'Y2FwdHVyZWQ=', uri: 'file:///documents/original.jpg' };

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
    (getImageFromCamera as jest.Mock).mockResolvedValue(CAPTURED_IMAGE);
    (resizeImage as jest.Mock).mockResolvedValue({ path: RESIZED_PATH });
    fs.seed(RESIZED_PATH, PHOTO_BYTES);
  });

  // verifies spec: MOB, CACHE — capture admits to the outbox tier and the
  // record carries the hash and the admitted size, never the bytes
  it('stores a captured photo in the outbox and records only its hash and size', async () => {
    const { getByText } = await render(<UploadPhoto onChange={onChange} value={null} />);

    await takePhoto(getByText);
    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const [attachmentId] = onChange.mock.calls[0];
    const attachment = await Database.models.Attachment.findOne({ where: { id: attachmentId } });
    expect(attachment.hash).toBe(PHOTO_HASH);
    expect(Number(attachment.size)).toBe(PHOTO_BYTES.length);

    const blob = await Database.models.Blob.findOne({ where: { hash: PHOTO_HASH } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
    expect(fs.contentsOf(store.pathFor(PHOTO_HASH)).toString()).toBe(PHOTO_BYTES);

    const [row] = await Database.models.Attachment.getRepository().query(
      'SELECT * FROM attachments WHERE id = ?',
      [attachmentId],
    );
    const carriesBytes = Object.values(row).some(
      column => typeof column === 'string' && column.includes(CAPTURED_IMAGE.base64),
    );
    expect(carriesBytes).toBe(false);
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

  // verifies spec: MOB, CACHE — a removed photo's blob has no referencing
  // record left, so it can never become eligible for push
  it('demotes the removed photo\'s blob to reclaimable cache', async () => {
    const { getByText, rerender } = await render(<UploadPhoto onChange={onChange} value={null} />);
    await takePhoto(getByText);
    await waitFor(() => getByText('Remove photo'));

    const [attachmentId] = onChange.mock.calls[0];
    await rerender(<UploadPhoto onChange={onChange} value={attachmentId} />);
    await act(async () => {
      await fireEvent.press(getByText('Remove photo'));
    });

    await waitFor(async () => {
      expect(await Database.models.Attachment.findOne({ where: { id: attachmentId } })).toBeNull();
    });
    const blob = await Database.models.Blob.findOne({ where: { hash: PHOTO_HASH } });
    expect(blob.tier).toBe(BLOB_TIERS.CACHE);
  });

  // verifies spec: MOB, CACHE — content addressing lets two attachments share
  // one blob, so demoting on the first removal would make content another
  // record still references evictable before it has been pushed
  it('leaves the blob in the outbox while another attachment references its hash', async () => {
    const { getByText, rerender } = await render(<UploadPhoto onChange={onChange} value={null} />);
    await takePhoto(getByText);
    await waitFor(() => getByText('Remove photo'));

    const sharer = await Database.models.Attachment.createAndSaveOne<Attachment>({
      hash: PHOTO_HASH,
      size: PHOTO_BYTES.length,
      type: 'image/jpeg',
    });

    const [attachmentId] = onChange.mock.calls[0];
    await rerender(<UploadPhoto onChange={onChange} value={attachmentId} />);
    await act(async () => {
      await fireEvent.press(getByText('Remove photo'));
    });

    await waitFor(async () => {
      expect(await Database.models.Attachment.findOne({ where: { id: attachmentId } })).toBeNull();
    });
    expect(await Database.models.Attachment.findOne({ where: { id: sharer.id } })).not.toBeNull();
    const blob = await Database.models.Blob.findOne({ where: { hash: PHOTO_HASH } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
  });

  async function takePhoto(getByText): Promise<void> {
    await act(async () => {
      await fireEvent.press(getByText('Take photo with camera'));
    });
  }
});
