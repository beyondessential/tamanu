import RNFS from 'react-native-fs';

import { BlobTransfer, blobEndpoints, rangeHeader } from '@tamanu/blobs';
import { BlobHashMismatchError, NotFoundError, Problem, RemoteCallError } from '@tamanu/errors';

import { CentralServerConnection } from '~/services/sync/CentralServerConnection';
import { sleepAsync } from '~/services/sync/utils';
import { MobileBlobStore, BlobFileSystem, FILE_COPY_CHUNK_BYTES, PutResult } from './MobileBlobStore';

// spec: XFER
// Nothing to retry until the origin pushes.
export class BlobAwaitingUploadError extends NotFoundError {
  constructor(hash: string) {
    super(`Content for ${hash} has not reached the central server yet`);
  }
}

export interface TransferFileSystem extends BlobFileSystem {
  downloadFile(options: {
    fromUrl: string;
    toFile: string;
    headers: Record<string, string>;
  }): { jobId: number; promise: Promise<{ statusCode: number; bytesWritten: number }> };
  uploadFiles(options: {
    toUrl: string;
    files: { name: string; filename: string; filepath: string; filetype: string }[];
    method: string;
    binaryStreamOnly: boolean;
    headers: Record<string, string>;
  }): { jobId: number; promise: Promise<{ statusCode: number; body: string }> };
}

export interface BlobTransferChannelOptions {
  blobStore: MobileBlobStore;
  centralServer: CentralServerConnection;
  // spec: BLAC
  getFacilityId: () => Promise<string>;
  fs?: TransferFileSystem;
}

// spec: XFER
// Bytes move through files on disk rather than in-memory streams, so a large blob never loads
// whole.
export class BlobTransferChannel {
  #blobStore: MobileBlobStore;
  #centralServer: CentralServerConnection;
  #getFacilityId: () => Promise<string>;
  #fs: TransferFileSystem;
  #transfer: BlobTransfer;

  constructor({ blobStore, centralServer, getFacilityId, fs }: BlobTransferChannelOptions) {
    this.#blobStore = blobStore;
    this.#centralServer = centralServer;
    this.#getFacilityId = getFacilityId;
    this.#fs = fs ?? (RNFS as unknown as TransferFileSystem);
    this.#transfer = new BlobTransfer(
      {
        stat: hash => this.#blobStore.stat(hash),
        stagedSize: hash => this.#blobStore.stagedSize(hash),
        commitStaged: hash => this.#blobStore.commitStaged(hash),
        fetchInto: (hash, { offset }) => this.#fetchInto(hash, offset),
        remoteAvailability: hash => this.#probeCentral(hash),
        offer: (hash, { size }) => this.#offer(hash, size),
        pushChunk: (hash, { offset, length, totalSize }) => {
          // The device uploads whole files. Assert it, so lowering pushChunkBytes fails loudly
          // instead of over-delivering past what central staged.
          if (length !== totalSize - offset) {
            throw new Error(
              `Mobile blob push delivers whole files; expected length ${totalSize - offset} at offset ${offset}, got ${length}`,
            );
          }
          return this.#pushFrom(hash, totalSize, offset);
        },
        sleep: sleepAsync,
        awaitingUploadError: hash => new BlobAwaitingUploadError(hash),
      },
      {
        pushChunkBytes: Number.MAX_SAFE_INTEGER,
        // downloadFile reports bytes written, not the content's total.
        probeTotalSize: 'always',
      },
    );
  }

  // spec: XFER
  async availability(hash: string): Promise<{ availability: string; size?: number }> {
    return await this.#transfer.availability(hash);
  }

  // spec: XFER
  async fetchFromCentral(hash: string): Promise<PutResult> {
    return await this.#transfer.fetch(hash);
  }

  // spec: XFER
  // spec: SCRUB, MOB
  /**
   * Verified before it's offered: the device holds the only copy, so corruption surfaces as a
   * device fault rather than an endlessly refused push.
   */
  async pushToCentral(hash: string): Promise<{ acknowledged: boolean; existed?: boolean }> {
    const held = await this.#blobStore.stat(hash);
    if (!held) {
      throw new NotFoundError(`Cannot push a blob not held locally: ${hash}`);
    }
    if (!(await this.#blobStore.verify(hash))) {
      await this.#blobStore.markCorrupt(hash);
      throw new BlobHashMismatchError(
        `Captured content for ${hash} is corrupt on this device; retained instead of offered`,
      );
    }
    return await this.#transfer.push(hash);
  }

  // Bytes that landed are progress even when the attempt fails.
  async #fetchInto(hash: string, offset: number): Promise<{ totalSize?: number }> {
    const partPath = await this.#blobStore.prepareStagingPart(hash);
    let statusCode: number | undefined;
    try {
      ({ statusCode } = await this.#fs.downloadFile({
        fromUrl: this.#centralServer.apiUrl(blobEndpoints.content(hash), {
          facilityIds: await this.#getFacilityId(),
        }),
        toFile: partPath,
        headers: {
          ...this.#centralServer.authHeaders(),
          ...rangeHeader(offset),
        },
      }).promise);
    } catch (error) {
      // No status, but whatever arrived is still progress. If it wasn't the content, commit's
      // verification discards it.
      await this.#salvagePart(hash, partPath, offset);
      throw error;
    }

    if (statusCode === 401) {
      // A refresh that doesn't clear the rejection stalls out like any other attempt, rather than
      // spinning the loop on battery.
      await this.#centralServer.refresh();
      throw new RemoteCallError(`Blob fetch of ${hash} was refused as unauthenticated`);
    }
    if (statusCode === 404) {
      throw new BlobAwaitingUploadError(hash);
    }
    if (statusCode === 200) {
      await this.#blobStore.replaceStagedWithFile(hash, partPath);
    } else if (statusCode === 206) {
      await this.#blobStore.appendStagedFromFile(hash, partPath);
    } else {
      throw new RemoteCallError(`Blob fetch of ${hash} failed with status ${statusCode}`);
    }
    return {};
  }

  async #probeCentral(hash: string): Promise<{ availability: string; size?: number }> {
    return await this.#centralServer.get(blobEndpoints.availability(hash), {
      facilityIds: await this.#getFacilityId(),
    });
  }

  async #offer(
    hash: string,
    size: number,
  ): Promise<{ status: string; receivedBytes?: number }> {
    return await this.#centralServer.post(
      blobEndpoints.offer(hash),
      { facilityIds: await this.#getFacilityId() },
      { size },
    );
  }

  async #pushFrom(
    hash: string,
    size: number,
    offset: number,
  ): Promise<{ acknowledged: boolean; existed?: boolean }> {
    const storePath = await this.#blobStore.servablePath(hash);

    // A resume copies the remainder to a temp file first, since the upload API sends whole files.
    let uploadPath = storePath;
    let tempPath: string | null = null;
    if (offset > 0 || size === 0) {
      tempPath = `${this.#blobStore.stagingPartPathFor(hash)}.push`;
      await this.#blobStore.prepareStagingPart(hash);
      await this.#fs.writeFile(tempPath, '', 'base64');
      for (let position = offset; position < size; position += FILE_COPY_CHUNK_BYTES) {
        const chunk = await this.#fs.read(storePath, FILE_COPY_CHUNK_BYTES, position, 'base64');
        await this.#fs.appendFile(tempPath, chunk, 'base64');
      }
      uploadPath = tempPath;
    }

    try {
      const { statusCode, body } = await this.#fs.uploadFiles({
        toUrl: this.#centralServer.apiUrl(blobEndpoints.upload(hash), {
          offset,
          totalSize: size,
          facilityIds: await this.#getFacilityId(),
        }),
        files: [
          { name: 'blob', filename: 'blob', filepath: uploadPath, filetype: 'application/octet-stream' },
        ],
        method: 'PUT',
        binaryStreamOnly: true,
        headers: {
          ...this.#centralServer.authHeaders(),
          'content-type': 'application/octet-stream',
        },
      }).promise;

      if (statusCode === 401) {
        await this.#centralServer.refresh();
        throw new RemoteCallError(`Blob push of ${hash} needs re-authentication`);
      }
      const response = parseJsonBody(body);
      if (statusCode >= 400) {
        throw Problem.fromJSON(response) ??
          new RemoteCallError(`Blob push of ${hash} failed with status ${statusCode}`);
      }
      if (!response?.acknowledged) {
        // Every byte delivered but central still expects more: the sizes disagree.
        throw new RemoteCallError(
          `Push of ${hash} delivered ${size - offset} bytes without acknowledgement`,
        );
      }
      return response;
    } finally {
      if (tempPath && (await this.#fs.exists(tempPath))) {
        await this.#fs.unlink(tempPath);
      }
    }
  }

  async #salvagePart(hash: string, partPath: string, offset: number): Promise<void> {
    try {
      if (!(await this.#fs.exists(partPath))) {
        return;
      }
      if (offset === 0) {
        await this.#blobStore.replaceStagedWithFile(hash, partPath);
      } else {
        await this.#blobStore.appendStagedFromFile(hash, partPath);
      }
    } catch (error) {
      console.warn(`BlobTransferChannel: could not salvage partial download: ${error.message}`);
    }
  }

}

function parseJsonBody(body: string): any {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
