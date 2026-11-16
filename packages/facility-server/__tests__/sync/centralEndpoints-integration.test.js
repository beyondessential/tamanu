import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as jose from 'jose';

import { TamanuApi } from '@tamanu/api-client';
import {
  FACT_CENTRAL_ENDPOINTS,
  FACT_CENTRAL_ENDPOINT_IN_USE,
  JWT_KEY_ALG,
  JWT_KEY_ID,
  JWT_TOKEN_TYPES,
  SERVER_TYPES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';

import {
  CentralEndpointSelector,
  setCentralEndpointSelector,
} from '../../app/sync/CentralEndpointSelector';
import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';
import { createTestContext } from '../utilities';

// every facility suite stubs this module (see configureEnvironment.js)
const { CentralServerConnection } = await vi.importActual('../../app/sync/CentralServerConnection');

const A = 'https://a.example.com';
const B = 'https://b.example.com';
const DEVICE_ID = 'endpoints-integration-device';

const jsonResponse = (body, { status = 200, headers = {} } = {}) => {
  const text = JSON.stringify(body);
  return {
    status,
    ok: status < 400,
    json: async () => JSON.parse(text),
    text: async () => text,
    headers: {
      get: key => ({ 'x-tamanu-server': SERVER_TYPES.CENTRAL, ...headers })[key.toLowerCase()],
      has: key => key.toLowerCase() in headers,
    },
  };
};

// spec: CEND
describe('central endpoints, end to end through a sync', () => {
  let ctx;
  let token;
  let hosts;
  let calls;
  let sessionCounter = 0;

  // A central that implements just enough of the sync protocol for a session with nothing to
  // push or pull. `hosts` maps an origin to 'live' or 'down'.
  const fakeCentral = async (url, config = {}) => {
    const { origin, pathname } = new URL(url);
    const path = pathname.replace(/^\/api\//, '');
    const method = config.method ?? 'GET';
    calls.push({ origin, path, method, body: config.body && JSON.parse(config.body) });
    if (hosts[origin] === 'down') throw new TypeError('fetch failed');

    if (path === 'login') {
      return jsonResponse({
        token,
        refreshToken: 'refresh',
        settings: { sync: { streaming: false } },
      });
    }
    if (path === 'user/me')
      return jsonResponse({ id: 'user-1', displayName: 'Sync', email: 's@x.io' });
    if (path === 'sync' && method === 'POST') {
      sessionCounter += 1;
      return jsonResponse({
        status: 'goodToGo',
        sessionId: `session-${sessionCounter}`,
        tick: 100,
      });
    }
    if (path.endsWith('/metadata') && !path.includes('pull')) {
      return jsonResponse({ startedAtTick: 100 });
    }
    if (path.endsWith('pull/metadata')) return jsonResponse({ totalToPull: 0, pullUntil: 100 });
    if (path.endsWith('/pull')) return jsonResponse([]);
    if (method === 'GET' && (path.endsWith('/ready') || path.endsWith('/complete'))) {
      return jsonResponse(true);
    }
    if (path === 'admin/settingsPsk') return jsonResponse({ settingsPsk: '' });
    return jsonResponse({});
  };

  const syncStartsAt = () =>
    calls.filter(call => call.path === 'sync' && call.method === 'POST').map(call => call.origin);

  const makeSelector = (list, inUse) => {
    const selector = new CentralEndpointSelector({
      models: ctx.models,
      hosts: list,
      inUse,
      getDeviceId: () => DEVICE_ID,
      getProbeSettings: async () => ({ recheckIntervalMs: 60_000, probeTimeoutMs: 100 }),
      createProbeClient: ({ host }) => {
        const client = new TamanuApi({
          endpoint: `${host}/api`,
          agentName: SERVER_TYPES.FACILITY,
          agentVersion: '0.0.0',
          deviceId: DEVICE_ID,
          logger: { debug() {}, info() {}, warn() {}, error() {}, log() {} },
        });
        client.fetchImplementation = fakeCentral;
        return client;
      },
    });
    setCentralEndpointSelector(selector);
    return selector;
  };

  const makeSyncManager = () => {
    const centralServer = new CentralServerConnection({ deviceId: DEVICE_ID });
    centralServer.fetchImplementation = fakeCentral;
    return new FacilitySyncManager({
      models: ctx.models,
      sequelize: ctx.sequelize,
      centralServer,
    });
  };

  beforeAll(async () => {
    vi.useRealTimers();
    ctx = await createTestContext();
    token = await new jose.SignJWT({ userId: 'user-1', deviceId: DEVICE_ID })
      .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
      .setIssuedAt()
      .setIssuer('test-issuer')
      .setAudience(JWT_TOKEN_TYPES.ACCESS)
      .setExpirationTime('1d')
      .sign(new TextEncoder().encode('test-secret'));
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    calls = [];
    hosts = { [A]: 'live', [B]: 'live' };
    await ctx.models.LocalSystemFact.destroy({
      where: { key: [FACT_CENTRAL_ENDPOINTS, FACT_CENTRAL_ENDPOINT_IN_USE] },
      force: true,
    });
    await ctx.models.Setting.destroy({ where: { key: 'sync.centralEndpoints' }, force: true });
  });

  afterEach(() => setCentralEndpointSelector(null));

  it('lands on the second endpoint when the first is dead, reports it, and returns to the first once it is back', async () => {
    const selector = makeSelector([A, B], A);
    const syncManager = makeSyncManager();
    hosts[A] = 'down';

    expect(await syncManager.triggerSync()).toMatchObject({ ran: true });

    expect(selector.current()).toBe(B);
    expect(syncStartsAt()).toEqual([B]);
    expect(calls.find(call => call.path === 'sync')).toMatchObject({
      origin: B,
      body: { endpoint: B },
    });
    expect(await ctx.models.LocalSystemFact.get(FACT_CENTRAL_ENDPOINT_IN_USE)).toBe(B);

    // the first endpoint comes back, and the recheck moves back up to it
    hosts[A] = 'live';
    expect(await selector.recheckEarlier()).toBe(true);

    expect(await syncManager.triggerSync()).toMatchObject({ ran: true });
    expect(syncStartsAt()).toEqual([B, A]);
    expect(calls.filter(call => call.path === 'sync').at(-1).body.endpoint).toBe(A);
  });

  it('keeps a session on its endpoint even when an earlier one comes back during it', async () => {
    const selector = makeSelector([A, B], B);
    const syncManager = makeSyncManager();
    const realFetch = syncManager.centralServer.fetchImplementation;
    syncManager.centralServer.fetchImplementation = async (url, config) => {
      // the first endpoint answers a login mid-session, as the recheck timer would find
      if (new URL(url).pathname.endsWith('pull/metadata')) await selector.recheckEarlier();
      return realFetch(url, config);
    };

    await syncManager.triggerSync();

    expect(selector.current()).toBe(B);
    expect(calls.some(call => call.origin === A && call.path === 'sync/session-1/pull')).toBe(
      false,
    );

    // and once the session is over it is free to move
    expect(await selector.recheckEarlier()).toBe(true);
    expect(selector.current()).toBe(A);
  });

  it('records the list central supplied through settings once it has verified it', async () => {
    const selector = makeSelector([A], A);
    const syncManager = makeSyncManager();
    await ctx.models.Setting.set('sync.centralEndpoints', [B, A], SETTINGS_SCOPES.GLOBAL);

    await syncManager.triggerSync();

    expect(JSON.parse(await ctx.models.LocalSystemFact.get(FACT_CENTRAL_ENDPOINTS))).toEqual([
      B,
      A,
    ]);
    expect(selector.hosts).toEqual([B, A]);
    expect(selector.current()).toBe(B);
  });

  it('keeps the recorded list when none of the supplied endpoints can be reached', async () => {
    const selector = makeSelector([A], A);
    const syncManager = makeSyncManager();
    await ctx.models.Setting.set('sync.centralEndpoints', [B], SETTINGS_SCOPES.GLOBAL);
    hosts[B] = 'down';

    expect(await syncManager.triggerSync()).toMatchObject({ ran: true });

    expect(await ctx.models.LocalSystemFact.get(FACT_CENTRAL_ENDPOINTS)).toBeNull();
    expect(selector.hosts).toEqual([A]);
    expect(selector.current()).toBe(A);
  });
});
