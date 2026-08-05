import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES } from '@tamanu/constants';
import { BlobStore } from '@tamanu/database/blobStore';
import { ERROR_TYPE, Problem } from '@tamanu/errors';

import { BlobTransferChannel } from '../../app/blobTransfer/BlobTransferChannel';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

// In-memory stand-in for the Blob registry, as in the BlobStore unit tests.
function makeFakeBlobModel() {
  const rows = new Map();
  return {
    rows,
    async findOne({ where: { hash } }) {
      return rows.get(hash) ?? null;
    },
    async destroy({ where: { hash } }) {
      rows.delete(hash);
    },
    sequelize: {
      async query(_sql, { bind }) {
        if (!rows.has(bind.hash)) {
          rows.set(bind.hash, { ...bind });
        }
      },
    },
  };
}

async function makeStore() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-channel-test-'));
  const store = new BlobStore({
    root,
    models: { Blob: makeFakeBlobModel() },
    getFreeDiskReserveBytes: async () => 0,
  });
  return { root, store };
}

async function readAll(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Stands in for CentralServerConnection, implementing the central blob routes
// against a second BlobStore. Failure injection simulates the poor links the
// channel is built for: dropped fetch streams and pushes cut mid-chunk.
class FakeCentralConnection {
  // stop each fetch stream (with an error) after this many bytes; null = off
  dropFetchStreamsAfter = null;
  // accept only this many bytes of each pushed chunk, then fail; null = off
  cutPushChunksAfter = null;

  fetchCalls = 0;

  constructor(store) {
    this.store = store;
  }

  async fetch(endpoint, options = {}, upOptions = null) {
    this.fetchCalls += 1;
    const match = endpoint.match(/^blob\/(?<hash>[^/]+)(?:\/(?<action>availability|offer|content))?$/);
    if (!match) throw new Error(`FakeCentralConnection: unexpected endpoint ${endpoint}`);
    const hash = decodeURIComponent(match.groups.hash);

    switch (match.groups.action) {
      case 'availability':
        return await this.#availability(hash);
      case 'offer':
        return await this.#offer(hash);
      case 'content':
        return await this.#putContent(hash, options);
      default:
        return await this.#get(hash, upOptions ?? options);
    }
  }

  async #availability(hash) {
    const held = await this.store.stat(hash);
    return held
      ? { availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size: held.size }
      : { availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD };
  }

  async #offer(hash) {
    if (await this.store.stat(hash)) {
      return { status: BLOB_OFFER_STATUSES.ALREADY_STORED };
    }
    return {
      status: BLOB_OFFER_STATUSES.WANTED,
      receivedBytes: await this.store.stagedSize(hash),
    };
  }

  async #putContent(hash, { query: { offset, totalSize }, body }) {
    if (await this.store.stat(hash)) {
      return { acknowledged: true, existed: true };
    }

    let accepted = body;
    let cut = false;
    if (this.cutPushChunksAfter !== null && body.length > this.cutPushChunksAfter) {
      accepted = body.subarray(0, this.cutPushChunksAfter);
      cut = true;
    }
    const staged = await this.store.stagedSize(hash);
    if (offset !== staged) {
      throw new Problem(
        ERROR_TYPE.VALIDATION,
        'Validation error',
        400,
        `offset ${offset} does not match staged ${staged}`,
      );
    }
    const { stagedSize } = await this.store.stage(hash, Readable.from(accepted), { offset });
    if (cut) {
      throw new Problem(ERROR_TYPE.REMOTE, 'Remote call failed', 500, 'connection lost mid-chunk');
    }
    if (stagedSize < totalSize) {
      return { acknowledged: false, receivedBytes: stagedSize };
    }
    try {
      const { size, existed } = await this.store.commitStaged(hash);
      return { acknowledged: true, existed, size };
    } catch (error) {
      if (error.type === ERROR_TYPE.BLOB_HASH_MISMATCH) {
        throw new Problem(error.type, error.title, error.status, error.detail);
      }
      throw error;
    }
  }

  async #get(hash, { headers = {} } = {}) {
    const held = await this.store.stat(hash);
    if (!held) {
      throw new Problem(ERROR_TYPE.NOT_FOUND, 'Not found', 404, `Blob not held: ${hash}`);
    }

    const start = parseInt(headers.range?.match(/^bytes=(\d+)-$/)?.[1] ?? '0', 10);
    let source = await this.store.get(hash, start > 0 ? { start } : {});
    if (this.dropFetchStreamsAfter !== null) {
      const limit = this.dropFetchStreamsAfter;
      async function* dropping(stream) {
        let sent = 0;
        for await (const chunk of stream) {
          const remaining = limit - sent;
          if (chunk.length >= remaining) {
            yield chunk.subarray(0, remaining);
            throw new Error('stream dropped');
          }
          sent += chunk.length;
          yield chunk;
        }
      }
      source = Readable.from(dropping(source));
    }

    const length = held.size - start;
    const responseHeaders = new Map([['content-length', String(length)]]);
    if (start > 0) {
      responseHeaders.set('content-range', `bytes ${start}-${held.size - 1}/${held.size}`);
    }
    return {
      status: start > 0 ? 206 : 200,
      headers: responseHeaders,
      body: Readable.toWeb(source),
    };
  }
}

describe('BlobTransferChannel', () => {
  let localRoot;
  let centralRoot;
  let localStore;
  let centralStore;
  let central;
  let channel;

  beforeEach(async () => {
    ({ root: localRoot, store: localStore } = await makeStore());
    ({ root: centralRoot, store: centralStore } = await makeStore());
    central = new FakeCentralConnection(centralStore);
    channel = new BlobTransferChannel({
      blobStore: localStore,
      centralServer: central,
      pushChunkBytes: 8,
    });
  });

  afterEach(async () => {
    await fs.rm(localRoot, { recursive: true, force: true });
    await fs.rm(centralRoot, { recursive: true, force: true });
  });

  describe('availability', () => {
    it('reports locally held bytes as available', async () => {
      const { hash } = await localStore.put(Readable.from(Buffer.from('local bytes')));
      expect(await channel.availability(hash)).toEqual({
        availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
        size: 11,
      });
    });

    it('reports bytes held only by central as awaiting fetch', async () => {
      const { hash, size } = await centralStore.put(Readable.from(Buffer.from('central bytes')));
      expect(await channel.availability(hash)).toEqual({
        availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH,
        size,
      });
    });

    it('reports bytes held by neither as awaiting upload', async () => {
      expect(await channel.availability(hashOf('nowhere'))).toEqual({
        availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
      });
    });
  });

  describe('pushToCentral', () => {
    it('delivers a blob in chunks and reports the verified-store acknowledgement', async () => {
      const content = Buffer.from('this content spans several push chunks');
      const { hash } = await localStore.put(Readable.from(content));

      const result = await channel.pushToCentral(hash);
      expect(result).toMatchObject({ acknowledged: true, existed: false });
      expect((await readAll(await centralStore.get(hash))).equals(content)).toBe(true);
    });

    it('skips the byte transfer when central already holds the content', async () => {
      const content = Buffer.from('already on central');
      const { hash } = await localStore.put(Readable.from(content));
      await centralStore.put(Readable.from(content));
      central.fetchCalls = 0;

      const result = await channel.pushToCentral(hash);
      expect(result).toEqual({ acknowledged: true, existed: true });
      expect(central.fetchCalls).toBe(1); // the offer alone
    });

    it('resumes from the bytes central staged when a chunk is cut mid-delivery', async () => {
      const content = Buffer.from('pushed across a connection that keeps dropping');
      const { hash } = await localStore.put(Readable.from(content));
      central.cutPushChunksAfter = 5;

      const result = await channel.pushToCentral(hash);
      expect(result).toMatchObject({ acknowledged: true });
      expect((await readAll(await centralStore.get(hash))).equals(content)).toBe(true);
    });

    it('pushes a zero-byte blob', async () => {
      const { hash } = await localStore.put(Readable.from(Buffer.alloc(0)));

      const result = await channel.pushToCentral(hash);
      expect(result).toMatchObject({ acknowledged: true });
      expect(await centralStore.has(hash)).toBe(true);
    });

    it('surfaces a hash mismatch without retrying', async () => {
      const content = Buffer.from('honest content');
      const { hash } = await localStore.put(Readable.from(content));
      // corrupt the local bytes so what we deliver no longer matches the hash
      const digest = hash.split(':')[1];
      await fs.writeFile(
        path.join(localRoot, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4)),
        'corrupt content',
      );

      await expect(channel.pushToCentral(hash)).rejects.toMatchObject({
        type: ERROR_TYPE.BLOB_HASH_MISMATCH,
      });
      expect(await centralStore.has(hash)).toBe(false);
    });

    it('refuses to push a blob not held locally', async () => {
      await expect(channel.pushToCentral(hashOf('never stored'))).rejects.toMatchObject({
        type: ERROR_TYPE.NOT_FOUND,
      });
    });
  });

  describe('fetchFromCentral', () => {
    it('downloads, verifies, and stores central content', async () => {
      const content = Buffer.from('fetched from central');
      const { hash } = await centralStore.put(Readable.from(content));

      const result = await channel.fetchFromCentral(hash);
      expect(result).toMatchObject({ hash, size: content.length, existed: false });
      expect((await readAll(await localStore.get(hash))).equals(content)).toBe(true);
    });

    it('skips the transfer when the content is already held locally', async () => {
      const content = Buffer.from('already local');
      const { hash } = await localStore.put(Readable.from(content));
      central.fetchCalls = 0;

      const result = await channel.fetchFromCentral(hash);
      expect(result).toMatchObject({ hash, existed: true });
      expect(central.fetchCalls).toBe(0);
    });

    it('resumes from the staged bytes when the stream keeps dropping', async () => {
      const content = Buffer.from('a download that arrives a little at a time');
      const { hash } = await centralStore.put(Readable.from(content));
      central.dropFetchStreamsAfter = 7;

      const result = await channel.fetchFromCentral(hash);
      expect(result).toMatchObject({ hash, size: content.length, existed: false });
      expect((await readAll(await localStore.get(hash))).equals(content)).toBe(true);
    });

    it('propagates content-pending when central does not hold the bytes', async () => {
      await expect(channel.fetchFromCentral(hashOf('not on central'))).rejects.toMatchObject({
        type: ERROR_TYPE.NOT_FOUND,
      });
    });
  });

  describe('open', () => {
    it('serves local bytes directly', async () => {
      const content = Buffer.from('open local');
      const { hash } = await localStore.put(Readable.from(content));
      central.fetchCalls = 0;

      expect((await readAll(await channel.open(hash))).equals(content)).toBe(true);
      expect(central.fetchCalls).toBe(0);
    });

    it('fetches from central on a local miss, then serves', async () => {
      const content = Buffer.from(randomUUID());
      const { hash } = await centralStore.put(Readable.from(content));

      expect((await readAll(await channel.open(hash))).toString()).toBe(content.toString());
      expect(await localStore.has(hash)).toBe(true);
    });

    it('serves a range', async () => {
      const { hash } = await localStore.put(Readable.from(Buffer.from('hello world')));
      expect((await readAll(await channel.open(hash, { start: 6 }))).toString()).toBe('world');
    });
  });
});
