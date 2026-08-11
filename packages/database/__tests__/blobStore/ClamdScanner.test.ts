import net from 'node:net';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';

import { BLOB_SCAN_VERDICTS } from '@tamanu/constants';

import { ClamdScanner } from '../../src/blobStore/scanning/ClamdScanner';

interface ClamdRequest {
  command: string;
  chunks: Buffer[];
}

// Reads clamd's INSTREAM framing off the wire: the command, then each chunk as
// a big-endian length followed by that many bytes, ended by a zero length.
// Returns null until the whole stream has arrived, so the fake answers on the
// end-of-stream frame the way the daemon does.
function readStream(request: Buffer): ClamdRequest | null {
  const terminator = request.indexOf(0);
  if (terminator === -1) {
    return null;
  }
  const command = request.subarray(0, terminator).toString();
  const chunks: Buffer[] = [];
  let position = terminator + 1;
  while (position + 4 <= request.length) {
    const length = request.readUInt32BE(position);
    position += 4;
    if (length === 0) {
      return { command, chunks };
    }
    if (position + length > request.length) {
      return null;
    }
    chunks.push(request.subarray(position, position + length));
    position += length;
  }
  return null;
}

describe('ClamdScanner', () => {
  let server: net.Server | null = null;

  afterEach(async () => {
    await new Promise(closed => {
      server?.close(closed);
    });
    server = null;
  });

  // Answers one request and hands back what it was sent, so a test asserts on
  // the bytes that reached the daemon rather than on how they were written.
  const fakeClamd = async (reply: string) => {
    const requests: ClamdRequest[] = [];
    server = net.createServer(socket => {
      const received: Buffer[] = [];
      let answered = false;
      socket.on('data', chunk => {
        received.push(chunk);
        const request = answered ? null : readStream(Buffer.concat(received));
        if (request) {
          answered = true;
          requests.push(request);
          socket.end(reply);
        }
      });
    });
    await new Promise<void>(listening => {
      server!.listen(0, '127.0.0.1', listening);
    });
    const { port } = server!.address() as net.AddressInfo;
    return {
      scanner: new ClamdScanner({ address: `127.0.0.1:${port}`, timeoutMs: 5000 }),
      requests,
    };
  };

  const scanOf = (content: Buffer) => ({
    hash: 'sha256:whatever',
    open: async () => Readable.from([content]),
  });

  it('frames the content it streams, whatever the source hands back', async () => {
    const content = Buffer.alloc(64 * 1024 + 17, 'a');
    const { scanner, requests } = await fakeClamd('stream: OK\0');

    expect(await scanner.scan(scanOf(content))).toBe(BLOB_SCAN_VERDICTS.CLEAN);

    const { command, chunks } = requests[0]!;
    expect(command).toBe('zINSTREAM');
    // Re-chunked to the daemon's limit rather than passed through at whatever
    // size the read produced.
    expect(chunks.map(chunk => chunk.length)).toEqual([64 * 1024, 17]);
    expect(Buffer.concat(chunks).equals(content)).toBe(true);
  });

  it('reads an infected verdict', async () => {
    const { scanner } = await fakeClamd('stream: Eicar-Signature FOUND\0');

    expect(await scanner.scan(scanOf(Buffer.from('bad')))).toBe(BLOB_SCAN_VERDICTS.INFECTED);
  });
});
