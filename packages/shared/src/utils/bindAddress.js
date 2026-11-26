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

// Parse a comma-separated list of listeners read from the named environment variable.
function parseBindAddressList(value, variableName) {
  const addresses = value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(parseBindAddress);
  if (addresses.length === 0) {
    throw new Error(`${variableName} is set but contains no valid addresses: "${value}"`);
  }
  return addresses;
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
    return parseBindAddressList(bindAddress, 'BIND_ADDRESS');
  }

  const port = +process.env.PORT || fallbackPort;
  return [{ host: undefined, port }];
}

// spec: SYNC#the-facility-sync-server
const LOOPBACK_HOSTS = ['::1', '127.0.0.1'];

/**
 * Resolve the addresses the facility sync server should listen on: `SYNC_BIND_ADDRESS`
 * (same format as `BIND_ADDRESS`), or else both loopback addresses at the given port.
 *
 * A standalone sync server, the only listener in its process, also honours
 * `BIND_ADDRESS` and `PORT` ahead of the loopback addresses. Alongside the API
 * server, those belong to the API server.
 *
 * @returns {{ addresses: { host?: string, port: number }[], isDefault: boolean }}
 */
export function resolveSyncBindAddresses(port, { isStandalone = false } = {}) {
  const syncBindAddress = process.env.SYNC_BIND_ADDRESS?.trim();
  if (syncBindAddress) {
    return {
      addresses: parseBindAddressList(syncBindAddress, 'SYNC_BIND_ADDRESS'),
      isDefault: false,
    };
  }
  if (isStandalone && (process.env.BIND_ADDRESS?.trim() || +process.env.PORT)) {
    return { addresses: resolveBindAddresses(port), isDefault: false };
  }
  return { addresses: LOOPBACK_HOSTS.map(host => ({ host, port })), isDefault: true };
}

function formatBindAddress({ host, port }) {
  if (!host) return `port ${port}`;
  return host.includes(':') ? `[${host}]:${port}` : `${host}:${port}`;
}

// Listen on each address, reusing the primary http server for the first one and
// giving any others their own http server sharing the same request handler.
// Closing the primary server also closes the extras, so shutdown logic that only
// tracks the primary server keeps working.
function listenOnAddresses({ server, app, addresses, label }) {
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

function waitForListening(server) {
  return new Promise((resolve, reject) => {
    const onError = error => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
  });
}

/**
 * Listen on every address resolved from `BIND_ADDRESS` / `PORT` / `fallbackPort`.
 *
 * @returns {import('node:http').Server[]} every server now listening
 */
export function listenForBindAddresses({ server, app, fallbackPort, label = 'Server' }) {
  return listenOnAddresses({ server, app, addresses: resolveBindAddresses(fallbackPort), label });
}

/**
 * Listen on every address resolved by {@link resolveSyncBindAddresses}. Of the default
 * loopback addresses, only one needs to bind; addresses set explicitly must all bind.
 *
 * @returns {Promise<import('node:http').Server[]>} the servers that are listening
 */
export async function listenForSyncBindAddresses({
  server,
  app,
  port,
  isStandalone = false,
  label = 'Sync server',
}) {
  const { addresses, isDefault } = resolveSyncBindAddresses(port, { isStandalone });
  const servers = listenOnAddresses({ server, app, addresses, label });
  const outcomes = await Promise.allSettled(servers.map(waitForListening));

  const failures = outcomes.flatMap((outcome, index) =>
    outcome.status === 'rejected' ? [{ address: addresses[index], error: outcome.reason }] : [],
  );
  if (failures.length === 0) return servers;

  const failureSummary = failures
    .map(({ address, error }) => `${formatBindAddress(address)}: ${error.message}`)
    .join('; ');
  if (!isDefault || failures.length === servers.length) {
    throw new Error(`${label} could not listen on ${failureSummary}`);
  }

  log.warn(`${label} could not listen on every loopback address`, { failures: failureSummary });
  return servers.filter((_, index) => outcomes[index].status === 'fulfilled');
}
