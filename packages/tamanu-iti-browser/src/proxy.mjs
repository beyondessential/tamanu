import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import { pinnedTlsOptions, makePinnedAgent } from './trust.mjs';

/**
 * The loopback reverse proxy.
 *
 * Listens on 127.0.0.1:<port> and forwards to the facility over a BES-CA-pinned
 * TLS connection (the trust decision from trust.mjs). The browser talks plain
 * HTTP to this loopback origin — a secure context — and never sees a
 * certificate. On the wire, agent -> facility is BES-TLS; only the loopback hop
 * is plaintext, and it never leaves the machine.
 *
 * Handles both ordinary requests and WebSocket/`Upgrade` connections, rewriting
 * the Host header to the facility identity so upstream SNI + cert verification
 * line up.
 *
 * `facility` = { address, port, host } where `host` is the cert SAN identity.
 */
export function startLoopbackProxy({ listenPort, facility, caPem }) {
  const agent = makePinnedAgent({ caPem, expectedHost: facility.host });
  const tlsOpts = pinnedTlsOptions({ caPem, expectedHost: facility.host });

  const server = http.createServer((clientReq, clientRes) => {
    const upstream = https.request(
      {
        host: facility.address,
        port: facility.port,
        method: clientReq.method,
        path: clientReq.url,
        headers: { ...clientReq.headers, host: facility.host },
        agent,
      },
      upstreamRes => {
        clientRes.writeHead(upstreamRes.statusCode, upstreamRes.headers);
        upstreamRes.pipe(clientRes);
      },
    );
    upstream.on('error', err => {
      if (!clientRes.headersSent) clientRes.writeHead(502);
      clientRes.end(`iti-browser proxy error: ${err.message}`);
    });
    clientReq.pipe(upstream);
  });

  // WebSocket / Upgrade pass-through: open a pinned TLS socket to the facility,
  // replay the upgrade request with the rewritten Host, then splice the sockets.
  server.on('upgrade', (req, clientSocket, head) => {
    const upstream = tls.connect(
      { host: facility.address, port: facility.port, ...tlsOpts },
      () => {
        const headers = { ...req.headers, host: facility.host };
        let raw = `${req.method} ${req.url} HTTP/1.1\r\n`;
        for (const [k, v] of Object.entries(headers)) {
          if (v === undefined) continue;
          // A header value may be an array (repeated headers); emit each.
          for (const value of Array.isArray(v) ? v : [v]) raw += `${k}: ${value}\r\n`;
        }
        raw += '\r\n';
        upstream.write(raw);
        if (head && head.length) upstream.write(head);
        upstream.pipe(clientSocket);
        clientSocket.pipe(upstream);
      },
    );
    upstream.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => upstream.destroy());
  });

  return new Promise((resolve, reject) => {
    // Reject (rather than hang) if the bind fails, e.g. the persisted
    // per-facility port is already in use by another process.
    server.once('error', reject);
    server.listen(listenPort, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve({ server, port: server.address().port });
    });
  });
}
