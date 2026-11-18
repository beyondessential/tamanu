import { createServer } from 'node:http';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  listenForSyncBindAddresses,
  parseBindAddress,
  resolveBindAddresses,
  resolveSyncBindAddresses,
} from '../../src/utils/bindAddress';

describe('parseBindAddress', () => {
  it('parses a bare port', () => {
    expect(parseBindAddress('3000')).toEqual({ host: undefined, port: 3000 });
  });

  it('parses a bare port with a leading colon', () => {
    expect(parseBindAddress(':3000')).toEqual({ host: undefined, port: 3000 });
  });

  it('parses an IPv4 host and port', () => {
    expect(parseBindAddress('127.0.0.1:8080')).toEqual({ host: '127.0.0.1', port: 8080 });
  });

  it('parses a bracketed IPv6 host and port', () => {
    expect(parseBindAddress('[::1]:8080')).toEqual({ host: '::1', port: 8080 });
    expect(parseBindAddress('[2001:db8::1]:443')).toEqual({ host: '2001:db8::1', port: 443 });
  });

  it('trims surrounding whitespace', () => {
    expect(parseBindAddress('  127.0.0.1:8080  ')).toEqual({ host: '127.0.0.1', port: 8080 });
  });

  it('throws on a non-numeric port', () => {
    expect(() => parseBindAddress('127.0.0.1:abc')).toThrow();
  });

  it('throws on an empty or out-of-range port', () => {
    expect(() => parseBindAddress('127.0.0.1:')).toThrow(); // Number('') === 0, would bind ephemeral
    expect(() => parseBindAddress('[::1]:')).toThrow();
    expect(() => parseBindAddress(':0')).toThrow();
    expect(() => parseBindAddress(':70000')).toThrow();
  });

  it('throws on a malformed bracketed IPv6 address', () => {
    expect(() => parseBindAddress('[::1:8080')).toThrow(); // missing closing bracket
    expect(() => parseBindAddress('[::1]8080')).toThrow(); // missing colon after bracket
  });
});

describe('resolveBindAddresses', () => {
  const { BIND_ADDRESS, PORT } = process.env;

  afterEach(() => {
    if (BIND_ADDRESS === undefined) delete process.env.BIND_ADDRESS;
    else process.env.BIND_ADDRESS = BIND_ADDRESS;
    if (PORT === undefined) delete process.env.PORT;
    else process.env.PORT = PORT;
  });

  it('falls back to the config port when neither env var is set', () => {
    delete process.env.BIND_ADDRESS;
    delete process.env.PORT;
    expect(resolveBindAddresses(4000)).toEqual([{ host: undefined, port: 4000 }]);
  });

  it('uses PORT over the fallback', () => {
    delete process.env.BIND_ADDRESS;
    process.env.PORT = '5000';
    expect(resolveBindAddresses(4000)).toEqual([{ host: undefined, port: 5000 }]);
  });

  it('uses BIND_ADDRESS over PORT and the fallback', () => {
    process.env.BIND_ADDRESS = '127.0.0.1:9000';
    process.env.PORT = '5000';
    expect(resolveBindAddresses(4000)).toEqual([{ host: '127.0.0.1', port: 9000 }]);
  });

  it('throws when BIND_ADDRESS is set but has no valid segments', () => {
    process.env.BIND_ADDRESS = ' , ';
    delete process.env.PORT;
    expect(() => resolveBindAddresses(4000)).toThrow();
  });

  it('parses a comma-separated list of listeners', () => {
    process.env.BIND_ADDRESS = '127.0.0.1:9000, [::1]:9000 ,:9001';
    delete process.env.PORT;
    expect(resolveBindAddresses(4000)).toEqual([
      { host: '127.0.0.1', port: 9000 },
      { host: '::1', port: 9000 },
      { host: undefined, port: 9001 },
    ]);
  });
});

describe('resolveSyncBindAddresses', () => {
  const { SYNC_BIND_ADDRESS, BIND_ADDRESS, PORT } = process.env;

  afterEach(() => {
    for (const [name, value] of Object.entries({ SYNC_BIND_ADDRESS, BIND_ADDRESS, PORT })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it('defaults to the IPv6 and IPv4 loopback addresses on the given port', () => {
    delete process.env.SYNC_BIND_ADDRESS;
    expect(resolveSyncBindAddresses(4100)).toEqual({
      addresses: [
        { host: '::1', port: 4100 },
        { host: '127.0.0.1', port: 4100 },
      ],
      isDefault: true,
    });
  });

  it('ignores BIND_ADDRESS and PORT alongside the API server', () => {
    delete process.env.SYNC_BIND_ADDRESS;
    process.env.BIND_ADDRESS = '[::]:3000';
    process.env.PORT = '3000';
    expect(resolveSyncBindAddresses(4100).addresses).toEqual([
      { host: '::1', port: 4100 },
      { host: '127.0.0.1', port: 4100 },
    ]);
  });

  it('uses BIND_ADDRESS when standalone', () => {
    delete process.env.SYNC_BIND_ADDRESS;
    process.env.BIND_ADDRESS = '[::]:3000';
    process.env.PORT = '5000';
    expect(resolveSyncBindAddresses(4100, { isStandalone: true })).toEqual({
      addresses: [{ host: '::', port: 3000 }],
      isDefault: false,
    });
  });

  it('uses PORT on every interface when standalone', () => {
    delete process.env.SYNC_BIND_ADDRESS;
    delete process.env.BIND_ADDRESS;
    process.env.PORT = '3000';
    expect(resolveSyncBindAddresses(4100, { isStandalone: true })).toEqual({
      addresses: [{ host: undefined, port: 3000 }],
      isDefault: false,
    });
  });

  it('defaults to loopback when standalone with neither BIND_ADDRESS nor PORT', () => {
    delete process.env.SYNC_BIND_ADDRESS;
    delete process.env.BIND_ADDRESS;
    delete process.env.PORT;
    expect(resolveSyncBindAddresses(4100, { isStandalone: true }).isDefault).toBe(true);
  });

  it('uses SYNC_BIND_ADDRESS over BIND_ADDRESS and PORT when standalone', () => {
    process.env.SYNC_BIND_ADDRESS = ':4100';
    process.env.BIND_ADDRESS = '[::]:3000';
    process.env.PORT = '5000';
    expect(resolveSyncBindAddresses(4100, { isStandalone: true }).addresses).toEqual([
      { host: undefined, port: 4100 },
    ]);
  });

  it('uses SYNC_BIND_ADDRESS when set', () => {
    process.env.SYNC_BIND_ADDRESS = '[::]:4100, 10.0.0.1:4200';
    expect(resolveSyncBindAddresses(4100)).toEqual({
      addresses: [
        { host: '::', port: 4100 },
        { host: '10.0.0.1', port: 4200 },
      ],
      isDefault: false,
    });
  });

  it('throws when SYNC_BIND_ADDRESS is set but has no valid segments', () => {
    process.env.SYNC_BIND_ADDRESS = ' , ';
    expect(() => resolveSyncBindAddresses(4100)).toThrow(/SYNC_BIND_ADDRESS/);
  });
});

describe('listenForSyncBindAddresses', () => {
  const { SYNC_BIND_ADDRESS } = process.env;
  const openServers = [];
  let hasIpv6Loopback;

  const close = server =>
    new Promise(resolve => {
      server.close(() => resolve());
    });

  const listen = (host, port = 0) =>
    new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', reject);
      server.listen(port, host, () => {
        openServers.push(server);
        resolve(server);
      });
    });

  // A port that is free on both loopback addresses, held on 127.0.0.1 by the returned server.
  const holdIpv4Port = async () => {
    const blocker = await listen('127.0.0.1');
    return { blocker, port: blocker.address().port };
  };

  const createSyncServer = () => {
    const app = (_req, res) => res.end();
    const server = createServer(app);
    openServers.push(server);
    return { server, app };
  };

  beforeAll(async () => {
    hasIpv6Loopback = await listen('::1').then(
      server => close(server).then(() => true),
      () => false,
    );
  });

  afterEach(async () => {
    if (SYNC_BIND_ADDRESS === undefined) delete process.env.SYNC_BIND_ADDRESS;
    else process.env.SYNC_BIND_ADDRESS = SYNC_BIND_ADDRESS;
    await Promise.all(openServers.splice(0).map(close));
  });

  it('carries on when only one loopback address can be bound', async ({ skip }) => {
    if (!hasIpv6Loopback) skip();
    delete process.env.SYNC_BIND_ADDRESS;
    const { port } = await holdIpv4Port();
    const { server, app } = createSyncServer();

    const listening = await listenForSyncBindAddresses({ server, app, port });

    expect(listening).toEqual([server]);
    expect(server.address()).toMatchObject({ address: '::1', port });
  });

  it('throws when no loopback address can be bound', async () => {
    delete process.env.SYNC_BIND_ADDRESS;
    const { port } = await holdIpv4Port();
    if (hasIpv6Loopback) await listen('::1', port);
    const { server, app } = createSyncServer();

    await expect(listenForSyncBindAddresses({ server, app, port })).rejects.toThrow(
      /could not listen/,
    );
  });

  it('throws when an address set in SYNC_BIND_ADDRESS cannot be bound', async () => {
    const { port: freePort, blocker: freeBlocker } = await holdIpv4Port();
    await close(freeBlocker);
    const { port: heldPort } = await holdIpv4Port();
    process.env.SYNC_BIND_ADDRESS = `127.0.0.1:${freePort},127.0.0.1:${heldPort}`;
    const { server, app } = createSyncServer();

    await expect(listenForSyncBindAddresses({ server, app, port: 4100 })).rejects.toThrow(
      new RegExp(`127\\.0\\.0\\.1:${heldPort}`),
    );
  });
});
