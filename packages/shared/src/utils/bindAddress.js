import { createServer } from 'node:http';

import { log } from '../services/logging';

/**
 * Parse a single listen address into `{ host, port }`.
 *
 * Accepts:
 *  - a bare port: `3000` or `:3000` (host left undefined → all interfaces)
 *  - IPv4 host and port: `127.0.0.1:3000`
 *  - bracketed IPv6 host and port: `[::1]:3000`, `[2001:db8::1]:443`
 */
export function parseBindAddress(address) {
  const trimmed = address.trim();

  // Bracketed IPv6, e.g. [::1]:3000
  if (trimmed.startsWith('[')) {
    const closingBracket = trimmed.indexOf(']');
    if (closingBracket === -1 || trimmed[closingBracket + 1] !== ':') {
      throw new Error(`Invalid IPv6 bind address: ${address}`);
    }
    const host = trimmed.slice(1, closingBracket);
    return { host, port: parsePort(trimmed.slice(closingBracket + 2), address) };
  }

  // host:port (IPv4 or empty host) — split on the last colon so a bare `:3000` works
  const lastColon = trimmed.lastIndexOf(':');
  const host = lastColon === -1 ? '' : trimmed.slice(0, lastColon);
  const port = parsePort(lastColon === -1 ? trimmed : trimmed.slice(lastColon + 1), address);
  return { host: host || undefined, port };
}

// Reject anything that isn't a whole port number in 1–65535. In particular
// `Number('')` is 0, so an empty port (e.g. `127.0.0.1:`) must be caught here
// rather than silently binding an OS-assigned ephemeral port.
function parsePort(portString, address) {
  const port = Number(portString);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port in bind address: ${address}`);
  }
  return port;
}

/**
 * Resolve the set of addresses a server should listen on.
 *
 * `BIND_ADDRESS` (a comma-separated list of `host:port` listeners, IPv4 or
 * bracketed IPv6) takes precedence over `PORT`, which in turn overrides the
 * given fallback port from config.
 */
export function resolveBindAddresses(fallbackPort) {
  const bindAddress = process.env.BIND_ADDRESS?.trim();
  if (bindAddress) {
    const addresses = bindAddress
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(parseBindAddress);
    if (addresses.length === 0) {
      throw new Error(`BIND_ADDRESS is set but contains no valid addresses: "${process.env.BIND_ADDRESS}"`);
    }
    return addresses;
  }

  const port = +process.env.PORT || fallbackPort;
  return [{ host: undefined, port }];
}

function formatBindAddress({ host, port }) {
  if (!host) return `port ${port}`;
  return host.includes(':') ? `[${host}]:${port}` : `${host}:${port}`;
}

/**
 * Listen on every address resolved from `BIND_ADDRESS` / `PORT` / `fallbackPort`.
 *
 * The primary http server is reused for the first address; any additional
 * addresses get their own http server sharing the same request handler. Closing
 * the primary server also closes the extras, so existing shutdown logic that
 * only tracks the primary server keeps working.
 *
 * @returns {import('node:http').Server[]} every server now listening
 */
export function listenForBindAddresses({ server, app, fallbackPort, label = 'Server' }) {
  const addresses = resolveBindAddresses(fallbackPort);
  return addresses.map(({ host, port }, index) => {
    const target = index === 0 ? server : createServer(app);
    if (index !== 0) {
      server.on('close', () => target.close());
    }
    target.listen(port, host, () => {
      log.info(`${label} is running on ${formatBindAddress({ host, port })}!`);
    });
    return target;
  });
}
