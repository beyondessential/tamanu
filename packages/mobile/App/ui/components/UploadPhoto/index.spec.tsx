import React from 'react';
import { act, fireEvent, render as renderComponent } from '@testing-library/react-native';
import { Popup } from 'popup-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const render = (ui: React.ReactElement): ReturnType<typeof renderComponent> => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return renderComponent(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

const ROOT = '/blobs';
const RESIZED_PATH = '/documents/resized.jpg';
const HELD_PATH = '/documents/held.jpg';
const FETCHED_PATH = '/documents/fetched.jpg';
const PHOTO_BYTES = 'the captured photograph';
const PHOTO_HASH = sha256Hash(PHOTO_BYTES);
const PHOTO_URI = `data:image/jpeg;base64, ${Buffer.from(PHOTO_BYTES).toString('base64')}`;
const CAPTURED_IMAGE = { base64: 'Y2FwdHVyZWQ=', uri: 'file:///documents/original.jpg' };
const CAPTURED_URI = `data:image/jpeg;base64, ${CAPTURED_IMAGE.base64}`;

const displayedImageUri = (container): string | undefined =>
  container.queryAll(node => node.type === 'Image')[0]?.props?.source?.uri;

// The device reports connectivity through the hook's own state, which is what
// re-renders a mounted component when it changes.
const connectivity = {
  current: { isInternetReachable: true } as { isInternetReachable: boolean | null },
  subscribers: new Set<(value: { isInternetReachable: boolean | null }) => void>(),
};

const useConnectivity = (): { isInternetReachable: boolean | null } => {
  const [reported, setReported] = React.useState(connectivity.current);
  React.useEffect(() => {
    connectivity.subscribers.add(setReported);
    return (): void => {
      connectivity.subscribers.delete(setReported);
    };
  }, []);
  return reported;
};

const deviceIsOffline = (): void => {
  connectivity.current = { isInternetReachable: false };
};

const connectivityIsUnknown = (): void => {
  connectivity.current = { isInternetReachable: null };
};

const connectivityReturns = async (): Promise<void> => {
  connectivity.current = { isInternetReachable: true };
  await act(async () => {
    connectivity.subscribers.forEach(notify => notify(connectivity.current));
  });
};

describe('<UploadPhoto />', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;
  let cache: MobileBlobCache;
  let onChange: jest.Mock;
  let backendCalls: Promise<void>[];
  let contentReads: number;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
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
    trackBackendCalls();

    onChange = jest.fn();
    (useBackend as jest.Mock).mockReturnValue({ models: Database.models, blobCache: cache });
    connectivity.current = { isInternetReachable: true };
    (useNetInfo as jest.Mock).mockImplementation(useConnectivity);
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
    await settleRead();

    expect(displayedImageUri(container)).toBe(PHOTO_URI);
    expect(getByText('Remove photo')).toBeTruthy();
    expect(getByText('Change photo')).toBeTruthy();
    expect(queryByText('Upload photo')).toBeNull();
  });

  // verifies spec: MOB — content the device does not hold is fetched by hash
  // and admitted to the cache tier
  it('fetches a photo the device does not hold', async () => {
    const attachment = await seedAttachment();
    fetchesPhoto();

    const { container } = await render(<UploadPhoto onChange={onChange} value={attachment.id} />);
    await settleRead();

    expect(displayedImageUri(container)).toBe(PHOTO_URI);
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
    await settleRead();

    expect(getByText(/has not finished uploading from the device that captured it/)).toBeTruthy();
    expect(getByText('Remove photo')).toBeTruthy();
    expect(queryByText('Upload photo')).toBeNull();
  });

  // verifies spec: MOB — content this device could not fetch is distinct from
  // content pending at its origin, and neither reads as a missing photo
  it('reports a photo not on this device when the fetch cannot reach the network', async () => {
    deviceIsOffline();
    const attachment = await seedAttachment();
    cache.setTransferChannel({
      fetchFromCentral: jest.fn(async () => {
        throw new Error('network request failed');
      }),
    } as any);

    const { getByText, queryByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );
    await settleRead();

    expect(getByText(/is not on this device yet/)).toBeTruthy();
    expect(getByText(/Connect to the internet to fetch it/)).toBeTruthy();
    expect(getByText('Remove photo')).toBeTruthy();
    expect(queryByText('Upload photo')).toBeNull();
  });

  // verifies spec: MOB — a record whose content this device cannot resolve is
  // a photo awaiting its content, not an answer with no photo
  it('reports a photo whose record has not reached this device', async () => {
    const { getByText, queryByText } = await render(
      <UploadPhoto onChange={onChange} value="an-answer-from-another-device" />,
    );
    await settleRead();

    expect(getByText(/is not on this device yet/)).toBeTruthy();
    expect(getByText('Remove photo')).toBeTruthy();
    expect(queryByText('Upload photo')).toBeNull();
  });

  // The connectivity the device reports arrives after the first render, so a
  // photo already being read must not be stranded by it.
  it('shows the photo when connectivity is reported while the read is in flight', async () => {
    connectivityIsUnknown();
    const attachment = await seedAttachment();
    const releaseFetch = deferPhotoFetch();

    const { container } = await render(<UploadPhoto onChange={onChange} value={attachment.id} />);
    await connectivityReturns();
    releaseFetch();
    await settleRead();

    expect(displayedImageUri(container)).toBe(PHOTO_URI);
    expect(contentReads).toBe(1);
  });

  // verifies spec: MOB — content the device could not fetch is fetched again
  // once it has connectivity, so the advice to connect can be acted on
  it('fetches the photo again once connectivity returns', async () => {
    deviceIsOffline();
    const attachment = await seedAttachment();
    let reachable = false;
    cache.setTransferChannel({
      fetchFromCentral: jest.fn(async () => {
        if (!reachable) {
          throw new Error('network request failed');
        }
        fs.seed(FETCHED_PATH, PHOTO_BYTES);
        return await store.putFile(FETCHED_PATH);
      }),
    } as any);

    const { container } = await render(<UploadPhoto onChange={onChange} value={attachment.id} />);
    await settleRead();
    expect(displayedImageUri(container)).toBeUndefined();

    reachable = true;
    await connectivityReturns();
    await settleRead();

    expect(displayedImageUri(container)).toBe(PHOTO_URI);
  });

  // A photo captured here is already on screen, so the value the form hands
  // back is not read from the store again.
  it('does not read back a photo it just captured', async () => {
    const { container, getByText, rerender } = await render(
      <UploadPhoto onChange={onChange} value={null} />,
    );
    await takePhoto(getByText);

    const [attachmentId] = onChange.mock.calls[0];
    await rerender(<UploadPhoto onChange={onChange} value={attachmentId} />);
    await settleRead();

    expect(displayedImageUri(container)).toBe(CAPTURED_URI);
    expect(contentReads).toBe(0);
  });

  // verifies spec: MOB, CACHE — a removed photo's blob has no referencing
  // record left, so it can never become eligible for push
  it("demotes the removed photo's blob to reclaimable cache", async () => {
    const attachment = await holdPhotoOnDevice();

    const { container, getByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );
    await settleRead();
    expect(displayedImageUri(container)).toBe(PHOTO_URI);
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
    await settleRead();
    expect(displayedImageUri(container)).toBe(PHOTO_URI);
    await removePhoto(getByText);

    expect(await Database.models.Attachment.findOne({ where: { id: attachment.id } })).toBeNull();
    expect(await Database.models.Attachment.findOne({ where: { id: sharer.id } })).not.toBeNull();
    const blob = await Database.models.Blob.findOne({ where: { hash: PHOTO_HASH } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
  });

  // A read that lands after the photo is removed must not put it back on
  // screen, since the record it belonged to is gone.
  it('discards content that arrives after the photo is removed', async () => {
    const attachment = await seedAttachment();
    const releaseFetch = deferPhotoFetch();

    const { container, getByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );
    await removePhoto(getByText);
    releaseFetch();
    await settleRead();

    expect(displayedImageUri(container)).toBeUndefined();
    expect(getByText('Upload photo')).toBeTruthy();
  });

  // A capture owns the field from the moment it completes, so a read of the
  // photo it replaced must not put the old one back on screen.
  it('keeps the captured photo when the read it replaced lands afterwards', async () => {
    const attachment = await seedAttachment();
    const releaseFetch = deferPhotoFetch();

    const { container, getByText } = await render(
      <UploadPhoto onChange={onChange} value={attachment.id} />,
    );
    await takePhoto(getByText);
    releaseFetch();
    await settleRead();

    expect(displayedImageUri(container)).toBe(CAPTURED_URI);
    expect(getByText('Remove photo')).toBeTruthy();
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

  function fetchesPhoto(): void {
    cache.setTransferChannel({
      fetchFromCentral: jest.fn(async () => {
        fs.seed(FETCHED_PATH, PHOTO_BYTES);
        return await store.putFile(FETCHED_PATH);
      }),
    } as any);
  }

  function deferPhotoFetch(): () => void {
    let release: () => void;
    const released = new Promise<void>(resolve => {
      release = resolve;
    });
    cache.setTransferChannel({
      fetchFromCentral: jest.fn(async () => {
        await released;
        fs.seed(FETCHED_PATH, PHOTO_BYTES);
        return await store.putFile(FETCHED_PATH);
      }),
    } as any);
    return () => release();
  }

  // A photo resolves behind six or more database round trips. Draining the
  // calls the component makes, rather than polling what it has rendered,
  // keeps these assertions off a wall-clock budget.
  function trackBackendCalls(): void {
    backendCalls = [];
    contentReads = 0;
    const track = <T,>(call: Promise<T>): Promise<T> => {
      backendCalls.push(call.then(ignoreOutcome, ignoreOutcome));
      return call;
    };

    const { Attachment: attachmentModel } = Database.models;
    const findOne = attachmentModel.findOne.bind(attachmentModel);
    jest.spyOn(attachmentModel, 'findOne').mockImplementation(options => track(findOne(options)));

    const readBase64 = cache.readBase64.bind(cache);
    jest.spyOn(cache, 'readBase64').mockImplementation(hash => {
      contentReads += 1;
      return track(readBase64(hash));
    });
  }

  async function settleRead(): Promise<void> {
    await act(async () => {
      for (let drained = 0; drained < backendCalls.length; ) {
        const pending = backendCalls.slice(drained);
        drained = backendCalls.length;
        await Promise.all(pending);
      }
    });
  }

  function ignoreOutcome(): void {}

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
