import net from 'node:net';
import type { Readable } from 'node:stream';

import { BLOB_SCAN_VERDICTS, type BlobScanVerdict } from '@tamanu/constants';

import {
  BlobScannerUnavailableError,
  type BlobScanTarget,
  type BlobScannerDriver,
  type ScannerVersions,
} from './types';

// clamd's stream framing: each chunk is a big-endian length followed by that
// many bytes, and a zero length ends the stream.
const CHUNK_HEADER_BYTES = 4;
const END_OF_STREAM = Buffer.alloc(CHUNK_HEADER_BYTES);
const STREAM_CHUNK_BYTES = 64 * 1024;

// Replies are NUL-terminated when the command was sent in the `z` form.
const REPLY_TERMINATOR = 0;

export interface ClamdScannerOptions {
  /** An absolute path for a unix socket, or `host:port` for TCP. */
  address: string;
  timeoutMs: number;
}

// spec: AV
// Drives ClamAV's daemon over its own socket protocol. Content is streamed to
// clamd (INSTREAM) rather than named to it by path, so the daemon needs no
// access to the blob store's filesystem: it can run in its own container or on
// another host. The cost is clamd's stream limit, which is why blobs above the
// configured size are left unscanned rather than sent.
export class ClamdScanner implements BlobScannerDriver {
  readonly #address: string;
  readonly #timeoutMs: number;

  constructor({ address, timeoutMs }: ClamdScannerOptions) {
    this.#address = address;
    this.#timeoutMs = timeoutMs;
  }

  async versions(): Promise<ScannerVersions> {
    // "ClamAV 1.0.5/27100/Thu Aug  7 08:22:03 2026": engine, signature
    // database version, and when that database was built.
    const reply = await this.#request('zVERSION\0');
    const [engine, signature] = reply.split('/');
    if (!engine) {
      throw new BlobScannerUnavailableError(`clamd gave no version: ${reply}`);
    }
    return {
      scannerVersion: engine.trim(),
      signatureVersion: (signature ?? '').trim(),
    };
  }

  async scan({ hash, open }: BlobScanTarget): Promise<BlobScanVerdict> {
    const source = await open();
    let reply: string;
    try {
      reply = await this.#request('zINSTREAM\0', source);
    } finally {
      source.destroy();
    }
    // "stream: OK" or "stream: Eicar-Signature FOUND"; anything else (a size
    // limit, a permission problem) is the scanner failing to give a verdict.
    if (reply.endsWith('OK')) {
      return BLOB_SCAN_VERDICTS.CLEAN;
    }
    if (reply.endsWith('FOUND')) {
      return BLOB_SCAN_VERDICTS.INFECTED;
    }
    throw new BlobScannerUnavailableError(`clamd could not scan ${hash}: ${reply}`);
  }

  #connect(): net.Socket {
    const separator = this.#address.lastIndexOf(':');
    if (this.#address.startsWith('/') || separator === -1) {
      return net.createConnection({ path: this.#address });
    }
    return net.createConnection({
      host: this.#address.slice(0, separator),
      port: Number(this.#address.slice(separator + 1)),
    });
  }

  /**
   * One command and its reply on a fresh connection. clamd closes the socket
   * after answering, so a connection is never reused and a hung scan cannot
   * poison a later one.
   */
  async #request(command: string, source?: Readable): Promise<string> {
    const socket = this.#connect();
    socket.setTimeout(this.#timeoutMs);

    try {
      return await new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const fail = (error: unknown, message: string) =>
          reject(new BlobScannerUnavailableError(message, { cause: error }));

        socket.once('error', error => fail(error, `clamd at ${this.#address} is unreachable`));
        socket.once('timeout', () =>
          fail(null, `clamd at ${this.#address} did not answer within ${this.#timeoutMs}ms`),
        );
        socket.on('data', chunk => chunks.push(chunk));
        socket.once('end', () => {
          const reply = Buffer.concat(chunks);
          const terminator = reply.indexOf(REPLY_TERMINATOR);
          resolve(reply.subarray(0, terminator === -1 ? reply.length : terminator).toString());
        });

        socket.once('connect', () => {
          socket.write(command);
          if (!source) {
            return;
          }
          void this.#streamTo(socket, source).catch(error =>
            fail(error, `could not stream content to clamd at ${this.#address}`),
          );
        });
      });
    } finally {
      socket.destroy();
    }
  }

  async #streamTo(socket: net.Socket, source: Readable): Promise<void> {
    for await (const chunk of chunked(source, STREAM_CHUNK_BYTES)) {
      const header = Buffer.alloc(CHUNK_HEADER_BYTES);
      header.writeUInt32BE(chunk.length);
      if (!socket.write(Buffer.concat([header, chunk]))) {
        await new Promise<void>(drained => {
          socket.once('drain', () => drained());
        });
      }
    }
    socket.write(END_OF_STREAM);
  }
}

/**
 * Re-chunks the source so one clamd frame never carries more than the daemon
 * expects, whatever size the filesystem hands back.
 */
async function* chunked(source: Readable, size: number): AsyncGenerator<Buffer> {
  for await (const chunk of source) {
    let buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    while (buffer.length > size) {
      yield buffer.subarray(0, size);
      buffer = buffer.subarray(size);
    }
    if (buffer.length > 0) {
      yield buffer;
    }
  }
}
