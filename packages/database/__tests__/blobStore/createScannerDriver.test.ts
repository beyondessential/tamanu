import net from 'node:net';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';

import { BLOB_SCAN_VERDICTS, BLOB_SCANNERS } from '@tamanu/constants';

import { createScannerDriver } from '../../src/blobStore/scanning/createScannerDriver';

// clamd answers zVERSION as soon as the command arrives, and zINSTREAM only once
// the zero-length frame has ended the content, so a fake has to read the framing
// to know when a request is complete.
function completedCommand(request: Buffer): string | null {
  const terminator = request.indexOf(0);
  if (terminator === -1) {
    return null;
  }
  const command = request.subarray(0, terminator).toString();
  if (command !== 'zINSTREAM') {
    return command;
  }
  let position = terminator + 1;
  while (position + 4 <= request.length) {
    const length = request.readUInt32BE(position);
    if (length === 0) {
      return command;
    }
    position += 4 + length;
  }
  return null;
}

// spec: AV
describe('createScannerDriver', () => {
  let server: net.Server | null = null;

  afterEach(async () => {
    const running = server;
    server = null;
    if (running) {
      await new Promise(closed => {
        running.close(closed);
      });
    }
  });

  const fakeClamd = async (replies: Record<string, string>) => {
    const connections: string[] = [];
    server = net.createServer(socket => {
      const received: Buffer[] = [];
      let answered = false;
      socket.on('data', chunk => {
        received.push(chunk);
        const command = answered ? null : completedCommand(Buffer.concat(received));
        if (command) {
          answered = true;
          connections.push(command);
          socket.end(replies[command]);
        }
      });
    });
    await new Promise<void>(listening => {
      server!.listen(0, '127.0.0.1', listening);
    });
    const { port } = server!.address() as net.AddressInfo;
    return { address: `127.0.0.1:${port}`, connections };
  };

  it('starts no scanner when the server names none', () => {
    const driver = createScannerDriver({
      scanner: BLOB_SCANNERS.NONE,
      address: '127.0.0.1:3310',
      timeoutMs: 1000,
    });

    expect(driver).toBeNull();
  });

  it('drives clamd at the named address when the server names clamd', async () => {
    const { address, connections } = await fakeClamd({
      zVERSION: 'ClamAV 1.0.5/27100/Thu Aug  7 08:22:03 2026\0',
      zINSTREAM: 'stream: OK\0',
    });

    const driver = createScannerDriver({
      scanner: BLOB_SCANNERS.CLAMD,
      address,
      timeoutMs: 5000,
    });

    expect(await driver!.versions()).toEqual({
      scannerVersion: 'ClamAV 1.0.5',
      signatureVersion: '27100',
    });
    expect(
      await driver!.scan({
        hash: 'sha256:whatever',
        size: 3,
        open: async () => Readable.from([Buffer.from('abc')]),
      }),
    ).toBe(BLOB_SCAN_VERDICTS.CLEAN);
    expect(connections).toEqual(['zVERSION', 'zINSTREAM']);
  });
});
