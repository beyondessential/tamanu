import RNFS from 'react-native-fs';

import { BlobTransfer } from '@tamanu/blobs';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { BlobHashMismatchError, NotFoundError, Problem, RemoteCallError } from '@tamanu/errors';

import { CentralServerConnection } from '~/services/sync/CentralServerConnection';
import { sleepAsync } from '~/services/sync/utils';
import { MobileBlobStore, BlobFileSystem, FILE_COPY_CHUNK_BYTES, PutResult } from './MobileBlobStore';

// spec: XFER
// A referenced blob whose bytes have not reached the central server yet: the
// content is awaiting upload from its origin, so a fetch cannot resolve it.
// Distinct from a transfer fault — there is nothing to retry until the origin
// pushes.
export class BlobAwaitingUploadError extends NotFoundError {
  constructor(hash: string) {
    super(`Content for ${hash} has not reached the central server yet`);
  }
}

/** The file-transfer subset of react-native-fs the channel uses. */
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
  /** The device's facility, declared to central to scope blob access (spec: BLAC). */
  getFacilityId: () => Promise<string>;
  fs?: TransferFileSystem;
}

// spec: XFER
// The device side of the blob transfer channel: availability (with the
// awaiting-upload/awaiting-fetch distinction), resumable fetch from central,
// and resumable push to central. The device counterpart of the facility
// server's channel, reshaped for a filesystem transfer API: bytes move through
// files on disk (a ranged download into staging, an upload streamed from a
// file) rather than through in-memory streams, so a large blob never loads
// whole.
//
// This is the primitive layer: it moves one blob per call and resumes across
// interruptions within the call. Scheduling — the post-sync pusher, retry over
// sync cycles, eviction — belongs to the cache tier above it.
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
        pushChunk: (hash, { offset, totalSize }) => this.#pushFrom(hash, totalSize, offset),
        sleep: sleepAsync,
        awaitingUploadError: hash => new BlobAwaitingUploadError(hash),
      },
      {
        // The upload API sends whole files, so the remainder goes in one
        // delivery rather than in chunks.
        pushChunkBytes: Number.MAX_SAFE_INTEGER,
        // downloadFile reports bytes written, not the content's total, so the
        // size has to come from the availability probe.
        probeTotalSize: 'always',
      },
    );
  }

  // spec: XFER
  // Availability of a referenced hash as served from here: bytes held locally
  // are available; bytes central holds are awaiting our fetch; bytes central
  // lacks are awaiting upload from their origin.
  async availability(hash: string): Promise<{ availability: string; size?: number }> {
    return await this.#transfer.availability(hash);
  }

  // spec: XFER
  /**
   * Fetch a blob's bytes from the central server into the device's store.
   * Idempotent: content already held skips the transfer. An interrupted
   * download resumes from the bytes already staged, including across calls
   * and app restarts, and the complete content is verified against the hash
   * before it is admitted. Bytes that cannot be resolved because central does
   * not hold them raise BlobAwaitingUploadError: content-pending at the
   * source, not a transfer fault.
   */
  async fetchFromCentral(hash: string): Promise<PutResult> {
    return await this.#transfer.fetch(hash);
  }

  // spec: XFER
  /**
   * Deliver a locally held blob's bytes to the central server. Idempotent:
   * content central already holds is acknowledged without transfer. The
   * acknowledgement arrives only once central has verified and durably stored
   * the content, so the caller may treat the local copy as evictable. An
   * interrupted push resumes from the bytes central has already staged.
   *
   * The outbox blob is verified against its hash before it is offered
   * (spec: SCRUB, MOB): the device holds the only copy of captured content, so
   * local corruption is quarantined and surfaced as a fault on the device
   * rather than as a push refused over and over.
   */
  async pushToCentral(hash: string): Promise<{ acknowledged: boolean; existed?: boolean }> {
    const held = await this.#blobStore.stat(hash);
    if (!held) {
      throw new NotFoundError(`Cannot push a blob not held locally: ${hash}`);
    }
    if (!(await this.#blobStore.verify(hash))) {
      await this.#blobStore.quarantine(hash);
      throw new BlobHashMismatchError(
        `Captured content for ${hash} is corrupt on this device; quarantined instead of offered`,
      );
    }
    return await this.#transfer.push(hash);
  }

  // One download attempt from `offset`, appending whatever arrives to the
  // staging. Whatever bytes landed are progress even when the attempt fails:
  // the caller counts a stall only when the staged size did not move.
  async #fetchInto(hash: string, offset: number): Promise<{ totalSize?: number }> {
    const partPath = await this.#blobStore.prepareStagingPart(hash);
    let statusCode: number | undefined;
    try {
      ({ statusCode } = await this.#fs.downloadFile({
        fromUrl: this.#centralServer.apiUrl(`blob/${encodeURIComponent(hash)}`, {
          facilityIds: await this.#getFacilityId(),
        }),
        toFile: partPath,
        headers: {
          ...this.#centralServer.authHeaders(),
          ...(offset > 0 ? { range: `bytes=${offset}-` } : {}),
        },
      }).promise);
    } catch (error) {
      // The connection dropped with no status; whatever bytes arrived are
      // still progress, so salvage them before the retry. If the interrupted
      // response wasn't the content after all, commit's verification discards
      // the staging and the next fetch starts clean.
      await this.#salvagePart(hash, partPath, offset);
      throw error;
    }

    if (statusCode === 401) {
      // Token expired mid-transfer: refresh so the retry from the same offset
      // carries fresh credentials. A refresh that doesn't clear the rejection
      // stalls out like any other attempt that delivered nothing, instead of
      // spinning the request loop on a battery-powered device.
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
    return await this.#centralServer.get(`blob/${encodeURIComponent(hash)}/availability`, {
      facilityIds: await this.#getFacilityId(),
    });
  }

  async #offer(
    hash: string,
    size: number,
  ): Promise<{ status: string; receivedBytes?: number }> {
    return await this.#centralServer.post(
      `blob/${encodeURIComponent(hash)}/offer`,
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

    // The whole blob streams straight from the store file; a resume from a
    // non-zero offset copies the remainder to a temporary file first, since
    // the upload API sends whole files. A completed staging (offset at size)
    // finalises with one empty delivery.
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
        toUrl: this.#centralServer.apiUrl(`blob/${encodeURIComponent(hash)}/content`, {
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
        // Refresh and let the outer loop retry via re-offer.
        await this.#centralServer.refresh();
        throw new RemoteCallError(`Blob push of ${hash} needs re-authentication`);
      }
      const response = parseJsonBody(body);
      if (statusCode >= 400) {
        throw Problem.fromJSON(response) ??
          new RemoteCallError(`Blob push of ${hash} failed with status ${statusCode}`);
      }
      if (!response?.acknowledged) {
        // Every byte was delivered but central still expects more: the sizes
        // disagree. Retriable via re-offer, which resets the shared position.
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
