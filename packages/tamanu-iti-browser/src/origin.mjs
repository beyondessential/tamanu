import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The browser-facing origin. The facility identity goes in the *host* so each
 * facility is a distinct web origin with its own isolated, persistent storage:
 *
 *   http://<facility-id>.localhost:<port>
 *
 * `.localhost` (not `.local`) is a reserved, loopback, secure-context namespace.
 * The port is part of the origin, so it must be stable per facility across
 * launches — otherwise storage is orphaned and the user is logged out. We
 * therefore persist a port per facility.
 */
export function facilityHost(facilityId) {
  return `${facilityId}.localhost`;
}

export function facilityOrigin(facilityId, port) {
  return `http://${facilityHost(facilityId)}:${port}`;
}

function readState(stateFile) {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/**
 * Return a port that is stable for this facility across launches. Persisted in
 * a small JSON state file so the origin — and therefore the storage partition —
 * stays constant.
 */
export async function stablePort(facilityId, stateFile) {
  const state = readState(stateFile);
  if (state[facilityId]) return state[facilityId];
  const port = await findFreePort();
  state[facilityId] = port;
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  return port;
}
