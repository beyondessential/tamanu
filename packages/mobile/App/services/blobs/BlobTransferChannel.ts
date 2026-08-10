import RNFS from 'react-native-fs';

import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES } from '@tamanu/constants';
import {
  BlobHashMismatchError,
  ERROR_TYPE,
  NotFoundError,
  Problem,
  RemoteCallError,
} from '@tamanu/errors';

import { CentralServerConnection } from '~/services/sync/CentralServerConnection';
import { sleepAsync } from '~/services/sync/utils';
import { MobileBlobStore, BlobFileSystem, FILE_COPY_CHUNK_BYTES, PutResult } from './MobileBlobStore';

// Consecutive attempts that deliver no new bytes before a transfer gives up.
// Attempts that make progress don't count: a transfer that keeps inching
// forward over a poor link is working as intended.
const STALLED_ATTEMPTS = 5;
const RETRY_BASE_MS = 500;

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

  constructor({ blobStore, centralServer, getFacilityId, fs }: BlobTransferChannelOptions) {
    this.#blobStore = blobStore;
    this.#centralServer = centralServer;
    this.#getFacilityId = getFacilityId;
    this.#fs = fs ?? (RNFS as unknown as TransferFileSystem);
  }

  // spec: XFER
  // Availability of a referenced hash as served from here: bytes held locally
  // are available; bytes central holds are awaiting our fetch; bytes central
  // lacks are awaiting upload from their origin.
  async availability(hash: string): Promise<{ availability: string; size?: number }> {
    const local = await this.#blobStore.stat(hash);
    if (local) {
      return { availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size: local.size };
    }
    const central = await this.#probeCentral(hash);
    if (central.availability === BLOB_AVAILABILITY_STATES.AVAILABLE) {
      return { availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH, size: central.size };
    }
    return { availability: central.availability };
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
    const held = await this.#blobStore.stat(hash);
    if (held) {
      return { hash, size: held.size, existed: true };
    }

    const central = await this.#probeCentral(hash);
    if (central.availability !== BLOB_AVAILABILITY_STATES.AVAILABLE) {
      throw new BlobAwaitingUploadError(hash);
    }
    const size = central.size;

    let stalledAttempts = 0;
    for (;;) {
      const offset = await this.#blobStore.stagedSize(hash);
      if (offset >= size) {
        // Everything is staged; commit verifies it. Over-staged content fails
        // verification there and is discarded, so the next call starts clean.
        break;
      }

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
        // still progress, so salvage them before retrying. If the interrupted
        // response wasn't the content after all, commit's verification
        // discards the staging and the next fetch starts clean.
        await this.#salvagePart(hash, partPath, offset);
        stalledAttempts = await this.#countStall(hash, offset, stalledAttempts);
        if (stalledAttempts >= STALLED_ATTEMPTS) {
          throw error;
        }
        await sleepAsync(RETRY_BASE_MS * stalledAttempts);
        continue;
      }

      if (statusCode === 401) {
        // Token expired mid-transfer: refresh and go again from the same offset.
        // Counted as a stalled attempt like any other response that delivered no
        // bytes, so a refresh that doesn't clear the rejection (revoked
        // credentials, a misconfigured server) gives up instead of spinning the
        // request loop on a battery-powered device.
        await this.#centralServer.refresh();
        stalledAttempts = await this.#countStall(hash, offset, stalledAttempts);
        if (stalledAttempts >= STALLED_ATTEMPTS) {
          throw new RemoteCallError(
            `Blob fetch of ${hash} was refused as unauthenticated after re-authentication`,
          );
        }
        await sleepAsync(RETRY_BASE_MS * stalledAttempts);
        continue;
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

      stalledAttempts = await this.#countStall(hash, offset, stalledAttempts);
      if (stalledAttempts >= STALLED_ATTEMPTS) {
        throw new RemoteCallError(`Fetch of ${hash} stalled at ${offset} of ${size} bytes`);
      }
      if (stalledAttempts > 0) {
        await sleepAsync(RETRY_BASE_MS * stalledAttempts);
      }
    }

    // Verifies the complete content, including bytes staged before any
    // interruption; a mismatch discards the staging so the next attempt
    // starts clean.
    return await this.#blobStore.commitStaged(hash);
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
    const { size } = held;

    const offer = await this.#offer(hash, size);
    if (offer.status === BLOB_OFFER_STATUSES.ALREADY_STORED) {
      return { acknowledged: true, existed: true };
    }

    let offset = offer.receivedBytes ?? 0;
    let stalledAttempts = 0;
    for (;;) {
      try {
        return await this.#pushFrom(hash, size, offset);
      } catch (error) {
        if (error?.type === ERROR_TYPE.BLOB_HASH_MISMATCH) {
          // Central discarded the staged content: what we sent doesn't match
          // the hash we hold it under. Local integrity's problem, not a
          // transfer retry's.
          throw error;
        }
        if (error?.type === ERROR_TYPE.FORBIDDEN) {
          // spec: BLAC
          // Central refuses the push: the blob's referencing record hasn't
          // synchronised there yet. Retrying without a sync in between cannot
          // change the answer, so fail now and let the pusher retry after the
          // next sync cycle.
          throw error;
        }
        // Learn where central actually got to and resume from there — covers
        // a connection dropped mid-body, where central staged part of what we
        // sent. A re-offer that itself fails is just another transient fault:
        // count it as a stalled attempt and retry from the same offset.
        let reoffer;
        try {
          reoffer = await this.#offer(hash, size);
        } catch {
          stalledAttempts += 1;
          if (stalledAttempts >= STALLED_ATTEMPTS) {
            throw error;
          }
          await sleepAsync(RETRY_BASE_MS * stalledAttempts);
          continue;
        }
        if (reoffer.status === BLOB_OFFER_STATUSES.ALREADY_STORED) {
          return { acknowledged: true, existed: true };
        }
        const serverOffset = reoffer.receivedBytes ?? 0;
        stalledAttempts = serverOffset > offset ? 0 : stalledAttempts + 1;
        if (stalledAttempts >= STALLED_ATTEMPTS) {
          throw error;
        }
        offset = serverOffset;
        await sleepAsync(RETRY_BASE_MS * stalledAttempts);
      }
    }
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

  async #countStall(hash: string, previousOffset: number, stalledAttempts: number): Promise<number> {
    const staged = await this.#blobStore.stagedSize(hash);
    return staged > previousOffset ? 0 : stalledAttempts + 1;
  }
}

function parseJsonBody(body: string): any {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
