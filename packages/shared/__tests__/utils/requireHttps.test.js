import { ForbiddenError } from '@tamanu/errors';
import {
  requireHttps,
  isRawRequestSecure,
  buildWebsocketHttpsGuard,
} from '../../src/utils/requireHttps';

// req.settings on the central server is a single ReadSettings-like object.
function centralSettings(requireHttpsValue) {
  return { get: jest.fn(async () => requireHttpsValue) };
}

// req.settings on the facility server is a map of facilityId -> ReadSettings-like object.
function facilitySettings(...requireHttpsValues) {
  return Object.fromEntries(
    requireHttpsValues.map((value, index) => [
      `facility-${index}`,
      { get: jest.fn(async () => value) },
    ]),
  );
}

function makeReq({ secure, settings }) {
  return { secure, settings };
}

describe('requireHttps', () => {
  it('allows HTTPS requests regardless of the setting', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: true, settings: centralSettings(true) }), {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows plain HTTP requests when the setting is off (central)', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: centralSettings(false) }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects plain HTTP requests with ForbiddenError when the setting is on (central)', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: centralSettings(true) }), {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('rejects plain HTTP on a facility server when the setting is on for its facility', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: facilitySettings(true) }), {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('rejects plain HTTP when any hosted facility requires HTTPS', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: facilitySettings(false, true) }), {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('allows plain HTTP when no hosted facility requires HTTPS', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: facilitySettings(false, false) }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows the request when settings are unavailable (pre-settings routes)', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: undefined }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes read errors to next instead of throwing', async () => {
    const next = jest.fn();
    const settings = { get: jest.fn(async () => { throw new Error('db down'); }) };
    await requireHttps(makeReq({ secure: false, settings }), {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toBe('db down');
  });
});

// Trusts only loopback, like Express's compiled trust-proxy fn with the default config.
const loopbackTrust = (address) => address === '127.0.0.1';

function rawReq({ encrypted, remoteAddress = '127.0.0.1', xForwardedProto } = {}) {
  return {
    socket: { encrypted, remoteAddress },
    headers: xForwardedProto ? { 'x-forwarded-proto': xForwardedProto } : {},
  };
}

describe('isRawRequestSecure', () => {
  it('is secure on a directly-encrypted socket', () => {
    expect(isRawRequestSecure(rawReq({ encrypted: true }), loopbackTrust)).toBe(true);
  });

  it('honours X-Forwarded-Proto: https from a trusted proxy', () => {
    expect(isRawRequestSecure(rawReq({ xForwardedProto: 'https' }), loopbackTrust)).toBe(true);
  });

  it('is not secure when a trusted proxy reports http', () => {
    expect(isRawRequestSecure(rawReq({ xForwardedProto: 'http' }), loopbackTrust)).toBe(false);
  });

  it('ignores X-Forwarded-Proto from an untrusted peer (spoof protection)', () => {
    const req = rawReq({ remoteAddress: '203.0.113.5', xForwardedProto: 'https' });
    expect(isRawRequestSecure(req, loopbackTrust)).toBe(false);
  });

  it('uses the first value of a multi-hop X-Forwarded-Proto', () => {
    expect(isRawRequestSecure(rawReq({ xForwardedProto: 'https, http' }), loopbackTrust)).toBe(true);
  });

  it('is not secure with no header and no trust function', () => {
    expect(isRawRequestSecure(rawReq(), undefined)).toBe(false);
  });
});

describe('buildWebsocketHttpsGuard', () => {
  const runGuard = (guard, req) =>
    new Promise((resolve) => {
      guard(req, (error, allowed) => resolve({ error, allowed }));
    });

  it('allows a secure handshake regardless of the setting', async () => {
    const guard = buildWebsocketHttpsGuard({
      getSettings: () => centralSettings(true),
      getTrustProxyFn: () => loopbackTrust,
    });
    const { allowed } = await runGuard(guard, rawReq({ xForwardedProto: 'https' }));
    expect(allowed).toBe(true);
  });

  it('rejects an insecure handshake when the setting is on', async () => {
    const guard = buildWebsocketHttpsGuard({
      getSettings: () => centralSettings(true),
      getTrustProxyFn: () => loopbackTrust,
    });
    const { error, allowed } = await runGuard(guard, rawReq({ xForwardedProto: 'http' }));
    expect(allowed).toBe(false);
    expect(error).toBeTruthy();
  });

  it('allows an insecure handshake when the setting is off', async () => {
    const guard = buildWebsocketHttpsGuard({
      getSettings: () => centralSettings(false),
      getTrustProxyFn: () => loopbackTrust,
    });
    const { allowed } = await runGuard(guard, rawReq({ xForwardedProto: 'http' }));
    expect(allowed).toBe(true);
  });

  it('fails closed when the setting cannot be read', async () => {
    const guard = buildWebsocketHttpsGuard({
      getSettings: () => ({ get: async () => { throw new Error('db down'); } }),
      getTrustProxyFn: () => loopbackTrust,
    });
    const { allowed } = await runGuard(guard, rawReq({ xForwardedProto: 'http' }));
    expect(allowed).toBe(false);
  });
});
