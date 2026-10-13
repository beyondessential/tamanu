import https from 'node:https';
import { makePinnedAgent } from './trust.mjs';
import { startLoopbackProxy } from './proxy.mjs';
import { facilityOrigin } from './origin.mjs';

/**
 * Probe one candidate: does it present a certificate that chains to the BES CA
 * *and* carries the expected facility SAN? A successful TLS handshake through
 * the pinned agent means yes. A wrong IP, another facility, a public-CA cert, or
 * an impostor all fail the handshake and are rejected here.
 */
export function verifyCandidate({ address, port, host, agent, timeoutMs = 3000 }) {
  return new Promise(resolve => {
    const req = https.request(
      { host: address, port, method: 'GET', path: '/health', headers: { host }, agent, timeout: timeoutMs },
      res => {
        // Trust already passed (TLS handshake through the pinned agent). Also
        // require a non-error status so we don't select a port that has the
        // right cert but isn't actually serving the facility (404/5xx).
        const served = res.statusCode >= 200 && res.statusCode < 400;
        res.resume();
        resolve(served);
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

/**
 * Given a facility (identity + BES CA + a stream/array of candidates), find the
 * first candidate that verifies, start the loopback proxy pointed at it, and
 * return the stable browser-facing origin.
 */
export async function connectFacility({ facilityId, host, caPem, candidates, listenPort = 0 }) {
  const agent = makePinnedAgent({ caPem, expectedHost: host });

  let winner = null;
  for await (const candidate of candidates) {
    if (await verifyCandidate({ ...candidate, host, agent })) {
      winner = candidate;
      break;
    }
  }
  if (!winner) {
    throw new Error(`no candidate presented a BES-trusted certificate for "${host}"`);
  }

  const { server, port } = await startLoopbackProxy({
    listenPort,
    facility: { address: winner.address, port: winner.port, host },
    caPem,
  });

  return {
    origin: facilityOrigin(facilityId, port),
    proxyPort: port,
    upstream: winner,
    close: () => new Promise(res => {
      server.close(res);
    }),
  };
}
