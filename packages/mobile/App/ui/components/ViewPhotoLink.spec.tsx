import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useNetInfo } from '@react-native-community/netinfo';

import { Database } from '~/infra/db';
import { useBackend } from '~/ui/hooks';
import { Attachment } from '~/models/Attachment';
import { BlobAwaitingUploadError } from '~/services/blobs/BlobTransferChannel';
import { MobileBlobCache } from '~/services/blobs/MobileBlobCache';
import { MobileBlobStore } from '~/services/blobs/MobileBlobStore';
import { deriveFreeDiskReserveBytes } from '~/services/blobs/deviceStorage';
import { FakeBlobFileSystem, sha256Hash } from '/root/tests/helpers/fakeBlobFileSystem';
import { ViewPhotoLink } from './ViewPhotoLink';

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: { DocumentDirectoryPath: '/documents' },
}));

jest.mock('@react-native-community/netinfo', () => ({ useNetInfo: jest.fn() }));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  __esModule: true,
  default: { save: jest.fn() },
}));

jest.mock('/helpers/file', () => ({
  deleteFileInDocuments: jest.fn(async () => {}),
  saveFileInDocuments: jest.fn(async () => '/documents/saved.jpg'),
}));

jest.mock('~/ui/hooks', () => ({ useBackend: jest.fn() }));

const ROOT = '/blobs';
const PHOTO_BYTES = 'the photograph on the device';
const PHOTO_HASH = sha256Hash(PHOTO_BYTES);
const PHOTO_BASE64 = Buffer.from(PHOTO_BYTES).toString('base64');
const PHOTO_URI = `data:image/jpeg;base64, ${PHOTO_BASE64}`;

const displayedImageUri = (container): string | undefined =>
  container.queryAll(node => node.type === 'Image')[0]?.props?.source?.uri;

describe('<ViewPhotoLink />', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;
  let cache: MobileBlobCache;
  let centralServer: { get: jest.Mock };

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

    centralServer = { get: jest.fn() };
    (useBackend as jest.Mock).mockReturnValue({
      models: Database.models,
      blobCache: cache,
      centralServer,
    });
    (useNetInfo as jest.Mock).mockReturnValue({ isInternetReachable: true });
  });

  // verifies spec: MOB — a read resolves the hash against the device's store,
  // and content the device holds is read without connectivity
  it('displays content the device holds without asking the central server', async () => {
    fs.seed('/documents/captured.jpg', PHOTO_BYTES);
    await cache.putOutbox('/documents/captured.jpg');
    const attachment = await seedAttachment(PHOTO_HASH);

    const { container, getByText } = await render(<ViewPhotoLink imageId={attachment.id} />);
    await act(async () => {
      await fireEvent.press(getByText('View Image'));
    });

    await waitFor(() => expect(displayedImageUri(container)).toBe(PHOTO_URI));
    expect(centralServer.get).not.toHaveBeenCalled();
  });

  // verifies spec: MOB, XFER — content pending at its origin is distinct from
  // content this device simply has not fetched
  it('reports content still awaiting upload from the device that captured it', async () => {
    cache.setTransferChannel({
      fetchFromCentral: jest.fn(async () => {
        throw new BlobAwaitingUploadError(PHOTO_HASH);
      }),
    } as any);
    const attachment = await seedAttachment(PHOTO_HASH);

    const { getByText } = await render(<ViewPhotoLink imageId={attachment.id} />);
    await act(async () => {
      await fireEvent.press(getByText('View Image'));
    });

    await waitFor(() =>
      expect(getByText(/has not finished uploading from the device that captured it/)).toBeTruthy(),
    );
    expect(centralServer.get).not.toHaveBeenCalled();
  });

  // verifies spec: MOB — content the device does not hold and cannot fetch
  // presents as a file awaiting its content, not as a missing record
  it('reports content not yet on this device when there is no connectivity', async () => {
    (useNetInfo as jest.Mock).mockReturnValue({ isInternetReachable: false });
    const attachment = await seedAttachment(PHOTO_HASH);

    const { getByText } = await render(<ViewPhotoLink imageId={attachment.id} />);
    await act(async () => {
      await fireEvent.press(getByText('View Image'));
    });

    await waitFor(() => expect(getByText(/is not on this device yet/)).toBeTruthy());
    expect(getByText(/Connect to the internet to fetch it/)).toBeTruthy();
    expect(centralServer.get).not.toHaveBeenCalled();
  });

  // A record with no hash is reachable only over the central attachment route.
  it('reports that a hashless record needs a live connection when offline', async () => {
    (useNetInfo as jest.Mock).mockReturnValue({ isInternetReachable: false });
    const attachment = await seedAttachment(null);

    const { getByText } = await render(<ViewPhotoLink imageId={attachment.id} />);
    await act(async () => {
      await fireEvent.press(getByText('View Image'));
    });

    await waitFor(() =>
      expect(getByText(/do not currently have an internet connection/)).toBeTruthy(),
    );
    expect(centralServer.get).not.toHaveBeenCalled();
  });

  // verifies spec: MOB, ATCH — a record carrying no hash falls back to the
  // central attachment route, which serves it by id
  it('serves a hashless record from the central attachment route', async () => {
    const attachment = await seedAttachment(null);
    centralServer.get.mockResolvedValue({ data: PHOTO_BASE64 });

    const { container, getByText } = await render(<ViewPhotoLink imageId={attachment.id} />);
    await act(async () => {
      await fireEvent.press(getByText('View Image'));
    });

    await waitFor(() => expect(displayedImageUri(container)).toBe(PHOTO_URI));
    expect(centralServer.get).toHaveBeenCalledWith(`attachment/${attachment.id}`, {
      base64: true,
    });
  });

  async function seedAttachment(hash: string | null): Promise<Attachment> {
    return await Database.models.Attachment.createAndSaveOne<Attachment>({
      hash,
      size: PHOTO_BYTES.length,
      type: 'image/jpeg',
    });
  }
});
