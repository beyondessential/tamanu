import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SERVER_TYPES,
  VERSION_COMPATIBILITY_ERRORS,
  VERSION_MAXIMUM_PROBLEM_KEY,
  VERSION_MINIMUM_PROBLEM_KEY,
  JWT_KEY_ALG,
  JWT_KEY_ID,
  JWT_TOKEN_TYPES,
} from '@tamanu/constants';
import {
  ClientIncompatibleError,
  ERROR_TYPE,
  InvalidCredentialError,
  Problem,
  RateLimitedError,
  ValidationError,
} from '@tamanu/errors';
import * as jose from 'jose';
import { TamanuApi } from '@tamanu/api-client';

const { CentralServerConnection } = await vi.importActual('../../app/sync/CentralServerConnection');
const { CentralEndpointSelector, setCentralEndpointSelector } = await vi.importActual(
  '../../app/sync/CentralEndpointSelector',
);
const { SyncLoginBackoff, setSyncLoginBackoff } = await vi.importActual(
  '../../app/sync/SyncLoginBackoff',
);

const fakeResponse = (response, body, headers = {}) => {
  const validBody = JSON.parse(JSON.stringify(body));
  return Promise.resolve({
    ...response,
    json: () => Promise.resolve(validBody),
    text: () => Promise.resolve(JSON.stringify(validBody)),
    headers: {
      get: key =>
        headers[key.toLowerCase()] ??
        {
          'x-tamanu-server': SERVER_TYPES.CENTRAL,
        }[key.toLowerCase()],
      has: key => key.toLowerCase() in headers,
    },
  });
};
const fakeSuccess = body => fakeResponse({ status: 200, ok: true }, body);
const fakeFailure = (status, body = {}, headers = {}) =>
  fakeResponse({ status, ok: false }, body, headers);
const fakeProblem = error => {
  const problem = Problem.fromError(error);
  return fakeResponse({ status: problem.status, ok: false }, problem.toJSON(), problem.headers);
};
// A reverse proxy answering for the central server with its own error page, so the
// body is HTML rather than a problem document.
const fakeGatewayFailure = status =>
  Promise.resolve({
    status,
    ok: false,
    json: () => Promise.reject(new Error('Unexpected token < in JSON at position 0')),
    text: () => Promise.resolve(`<!doctype html><title>${status}</title><h1>${status}</h1>`),
    headers: {
      get: key => ({ 'content-type': 'text/html; charset=utf-8' })[key.toLowerCase()],
      has: () => false,
    },
  });

describe('CentralServerConnection', () => {
  // Create a valid JWT token for testing
  let validTestToken;

  // The login backoff is process-wide and refusals pause it, so each test gets a fresh one, on a
  // clock it can move.
  let backoffNow;
  beforeEach(() => {
    backoffNow = 1_000_000;
    setSyncLoginBackoff(
      new SyncLoginBackoff({
        getSettings: async () => ({ initialDelayMs: 120_000, maxDelayMs: 3_600_000 }),
        now: () => backoffNow,
        getCredentialKey: () => 'credentials',
      }),
    );
  });
  afterEach(() => setSyncLoginBackoff(new SyncLoginBackoff()));

  beforeAll(async () => {
    // Create a valid JWT token that includes the deviceId
    const secret = 'test-secret';
    validTestToken = await new jose.SignJWT({
      userId: 'not-real',
      deviceId: 'test',
    })
      .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
      .setIssuedAt()
      .setIssuer('test-issuer')
      .setAudience(JWT_TOKEN_TYPES.ACCESS)
      .setExpirationTime('1d')
      .sign(new TextEncoder().encode(secret));
  });

  let authSuccess;

  beforeEach(() => {
    authSuccess = fakeSuccess({
      token: validTestToken,
      user: {
        id: 'not-real',
        displayName: 'Not Real',
        email: 'notreal@example.com',
      },
      settings: {
        sync: {
          streaming: false,
        },
      },
    });
  });
  const meSuccess = fakeSuccess({
    id: 'not-real',
    displayName: 'Not Real',
    email: 'notreal@example.com',
  });

  const authEmpty = fakeFailure(500);
  const authInvalid = fakeProblem(new InvalidCredentialError());
  const clientVersionLowLegacy = fakeFailure(
    400,
    {
      error: {
        message: VERSION_COMPATIBILITY_ERRORS.LOW,
        error: 'ClientIncompatibleError',
      },
    },
    {
      'x-min-client-version': '1.0.0',
      'x-max-client-version': '2.0.0',
    },
  );
  const clientVersionLow = fakeProblem(
    new ClientIncompatibleError(VERSION_COMPATIBILITY_ERRORS.LOW).withExtraData({
      [VERSION_MINIMUM_PROBLEM_KEY]: '1.0.0',
      [VERSION_MAXIMUM_PROBLEM_KEY]: '2.0.0',
    }),
  );
  const clientVersionHighLegacy = fakeFailure(
    400,
    {
      error: {
        message: VERSION_COMPATIBILITY_ERRORS.HIGH,
        error: 'ClientIncompatibleError',
      },
    },
    {
      'x-min-client-version': '1.0.0',
      'x-max-client-version': '2.0.0',
    },
  );
  const clientVersionHigh = fakeProblem(
    new ClientIncompatibleError(VERSION_COMPATIBILITY_ERRORS.HIGH).withExtraData({
      [VERSION_MINIMUM_PROBLEM_KEY]: '1.0.0',
      [VERSION_MAXIMUM_PROBLEM_KEY]: '2.0.0',
    }),
  );

  describe('authentication', () => {
    let fetch;
    let centralServer;
    beforeEach(() => {
      fetch = vi.spyOn(global, 'fetch');
      centralServer = new CentralServerConnection({ deviceId: 'test' });
      centralServer.fetchImplementation = fetch;
    });
    afterEach(() => {
      fetch.mockReset();
      fetch.mockRestore();
    });

    it('authenticates against a central server', async () => {
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(meSuccess);
      const { token, user } = await centralServer.connect();
      expect(token).toEqual(validTestToken);
      expect(user).toMatchObject({ id: 'not-real' });
    });

    it('throws an AuthenticationError if the credentials are invalid', async () => {
      fetch.mockReturnValueOnce(authInvalid);
      await expect(centralServer.connect()).rejects.toBeProblemOfType(
        ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
      );
    });

    it('throws a ClientIncompatibleError if the client version is too low', async () => {
      fetch.mockReturnValueOnce(clientVersionLow);
      await expect(centralServer.connect()).rejects.toThrow(/too low/i);
      fetch.mockReturnValueOnce(clientVersionLow);
      await expect(centralServer.connect()).rejects.toBeProblemOfType(
        ERROR_TYPE.CLIENT_INCOMPATIBLE,
      );
    });

    it('throws a ClientIncompatibleError if the client version is too low (legacy error)', async () => {
      fetch.mockReturnValueOnce(clientVersionLowLegacy);
      await expect(centralServer.connect()).rejects.toThrow(/too low/i);
      fetch.mockReturnValueOnce(clientVersionLowLegacy);
      await expect(centralServer.connect()).rejects.toBeProblemOfType(
        ERROR_TYPE.CLIENT_INCOMPATIBLE,
      );
    });

    it('throws a ClientIncompatibleError if the client version is too high', async () => {
      fetch.mockReturnValueOnce(clientVersionHigh);
      await expect(centralServer.connect()).rejects.toThrow(/too high/i);
      fetch.mockReturnValueOnce(clientVersionHigh);
      await expect(centralServer.connect()).rejects.toBeProblemOfType(
        ERROR_TYPE.CLIENT_INCOMPATIBLE,
      );
    });

    it('throws a ClientIncompatibleError if the client version is too high (legacy error)', async () => {
      fetch.mockReturnValueOnce(clientVersionHighLegacy);
      await expect(centralServer.connect()).rejects.toThrow(/too high/i);
      fetch.mockReturnValueOnce(clientVersionHighLegacy);
      await expect(centralServer.connect()).rejects.toBeProblemOfType(
        ERROR_TYPE.CLIENT_INCOMPATIBLE,
      );
    });

    it('throws if any other server error is returned', async () => {
      fetch.mockReturnValueOnce(fakeProblem(new ValidationError()));
      await expect(centralServer.connect()).rejects.toBeProblemOfType(ERROR_TYPE.VALIDATION);
    });

    it('throws a RemoteCallError if no data is returned with the error', async () => {
      fetch.mockReturnValueOnce(authEmpty);
      await expect(centralServer.connect()).rejects.toBeProblemOfType(ERROR_TYPE.REMOTE);
    });

    it('throws a RemoteCallError if the error body is not a problem document', async () => {
      // A gateway error page is the remote misbehaving, not a validation failure:
      // keeping it as a remote error (with its real status) is what lets callers
      // tell it apart from a problem the request itself caused.
      fetch.mockReturnValueOnce(fakeGatewayFailure(502));
      const problem = await centralServer.connect().catch(err => err);
      expect(problem).toBeProblemOfType(ERROR_TYPE.REMOTE);
      expect(problem.status).toBe(502);
    });

    it('retrieves server settings', async () => {
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(meSuccess);
      expect((await centralServer.loginData()).settings).toMatchObject({
        sync: {
          streaming: false,
        },
      });
    });

    it('retrieves user data', async () => {
      fetch
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(meSuccess)
        .mockReturnValueOnce(meSuccess);
      expect(await centralServer.whoami()).toMatchObject({ displayName: 'Not Real' });
    });

    it('retries if a token is invalid', async () => {
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(meSuccess); // first auth
      fetch.mockReturnValueOnce(authInvalid); // first whoami call
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(meSuccess); // second auth
      fetch.mockReturnValueOnce(meSuccess); // second whoami call
      expect(await centralServer.whoami()).toMatchObject({ displayName: 'Not Real' });
    });

    it('times out requests', async () => {
      vi.setConfig({ testTimeout: 2000 }); // fail quickly
      vi.useFakeTimers();
      fetch.mockReturnValue(
        Promise.reject(
          new (class extends Error {
            get name() {
              return 'AbortError';
            }
          })('fake timeout'),
        ),
      );
      const connectPromise = centralServer.connect();
      vi.runAllTimers();
      await expect(connectPromise).rejects.toThrow('fake timeout');
    });
  });

  // spec: CEND
  describe('central endpoints', () => {
    const A = 'https://a.example.com';
    const B = 'https://b.example.com';
    const C = 'https://c.example.com';

    // Stands in for the network. `hosts` maps an origin to how it behaves: 'live' answers every
    // call, 'down' fails to connect, 'refuses' rejects the login, 'locked' rate-limits it.
    let hosts;
    let calls;
    let fakeFetch;

    const respond = async (url, config = {}) => {
      const { origin, pathname } = new URL(url);
      calls.push({ origin, path: pathname.replace(/^\/api\//, ''), body: config.body });
      const behaviour = hosts[origin];
      if (behaviour === 'down') throw new TypeError('fetch failed');
      if (pathname.endsWith('/login')) {
        if (behaviour === 'refuses') return authInvalid;
        if (behaviour === 'locked') return fakeProblem(new RateLimitedError(60));
        return authSuccess;
      }
      if (pathname.endsWith('/user/me')) return meSuccess;
      return fakeSuccess({ answeredBy: origin });
    };

    const loginsAt = origin =>
      calls.filter(call => call.origin === origin && call.path === 'login').length;

    let publishedFacts;

    const makeSelector = ({ list = [A, B], inUse, canProbe } = {}) => {
      const selector = new CentralEndpointSelector({
        models: {
          LocalSystemFact: {
            get: async () => null,
            set: async (key, value) => void publishedFacts.push({ key, value }),
          },
        },
        hosts: list,
        inUse,
        canProbe,
        getDeviceId: () => 'test',
        getProbeSettings: async () => ({ recheckIntervalMs: 60_000, probeTimeoutMs: 100 }),
        createProbeClient: ({ host }) => {
          const client = new TamanuApi({
            endpoint: `${host}/api`,
            agentName: SERVER_TYPES.FACILITY,
            agentVersion: '0.0.0',
            deviceId: 'test',
            logger: { debug() {}, info() {}, warn() {}, error() {}, log() {} },
          });
          client.fetchImplementation = fakeFetch;
          return client;
        },
      });
      setCentralEndpointSelector(selector);
      return selector;
    };

    const makeConnection = () => {
      const connection = new CentralServerConnection({ deviceId: 'test' });
      connection.fetchImplementation = fakeFetch;
      return connection;
    };

    beforeEach(() => {
      // the timeout test above leaves fake timers installed, which would stall the backoff
      vi.useRealTimers();
      calls = [];
      publishedFacts = [];
      hosts = { [A]: 'live', [B]: 'live', [C]: 'live' };
      fakeFetch = vi.fn(respond);
    });

    afterEach(() => {
      setCentralEndpointSelector(null);
    });

    describe('setEndpoint', () => {
      it('points the client at the new endpoint and drops credentials for the old one', async () => {
        const connection = makeConnection();
        connection.setEndpoint(`${A}/api`);
        await connection.connect();
        expect(connection.hasToken()).toBe(true);
        expect(connection.host).toBe(A);

        connection.setEndpoint(`${B}/api`);

        expect(connection.host).toBe(B);
        expect(connection.hasToken()).toBe(false);
        await connection.whoami();
        expect(calls.at(-1).origin).toBe(B);
        expect(loginsAt(B)).toBe(1);
      });

      it('is a no-op for the endpoint already in use', async () => {
        const connection = makeConnection();
        connection.setEndpoint(`${A}/api`);
        await connection.connect();

        connection.setEndpoint(`${A}/api`);

        expect(connection.hasToken()).toBe(true);
      });
    });

    it('connects to the selector’s current endpoint rather than the configured host', async () => {
      makeSelector({ inUse: B });
      const connection = makeConnection();

      await connection.connect();

      expect(connection.host).toBe(B);
      expect(loginsAt(A)).toBe(0);
    });

    it('follows the selector when it moves between calls', async () => {
      const selector = makeSelector({ inUse: A });
      const connection = makeConnection();
      await connection.whoami();
      expect(calls.at(-1).origin).toBe(A);

      await selector.adopt([A, B], B);
      await connection.whoami();

      expect(connection.host).toBe(B);
      expect(calls.at(-1).origin).toBe(B);
      expect(loginsAt(B)).toBe(1);
    });

    describe('when logging in', () => {
      it('walks to the next endpoint when the first is unreachable', async () => {
        hosts[A] = 'down';
        const selector = makeSelector();
        const connection = makeConnection();

        await connection.connect();

        expect(selector.current()).toBe(B);
        expect(connection.host).toBe(B);
        expect(connection.hasToken()).toBe(true);
      });

      it('walks to the next endpoint when the first refuses the login', async () => {
        hosts[A] = 'refuses';
        const selector = makeSelector();
        const connection = makeConnection();

        await connection.connect();

        expect(selector.current()).toBe(B);
        expect(connection.hasToken()).toBe(true);
      });

      it('does not walk when the account is locked out, since more logins extend it', async () => {
        hosts[A] = 'locked';
        const selector = makeSelector();
        const connection = makeConnection();

        await expect(connection.connect()).rejects.toBeProblemOfType(ERROR_TYPE.RATE_LIMITED);

        expect(selector.current()).toBe(A);
        expect(loginsAt(A)).toBe(1);
        expect(loginsAt(B)).toBe(0);
      });

      it('fails with the original error when every endpoint refuses', async () => {
        hosts = { [A]: 'refuses', [B]: 'refuses' };
        const selector = makeSelector();
        const connection = makeConnection();

        await expect(connection.connect()).rejects.toBeProblemOfType(
          ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
        );

        expect(selector.current()).toBe(A);
        expect(connection.hasToken()).toBe(false);
      });

      it('does not ask the endpoint that refused again, however the walk ends', async () => {
        hosts = { [A]: 'refuses', [B]: 'refuses' };
        makeSelector();
        const connection = makeConnection();

        await expect(connection.connect()).rejects.toBeProblemOfType(
          ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
        );

        expect(loginsAt(A)).toBe(1);
        expect(loginsAt(B)).toBe(1);
      });

      it('does not ask the endpoint that refused again when the walk finds another', async () => {
        hosts[A] = 'refuses';
        makeSelector();
        const connection = makeConnection();

        await connection.connect();

        expect(loginsAt(A)).toBe(1);
        // once to check, once to log in
        expect(loginsAt(B)).toBe(2);
      });

      describe('after central refuses the credentials', () => {
        beforeEach(() => {
          hosts = { [A]: 'refuses', [B]: 'refuses' };
        });

        it('pauses further logins, failing at once without contacting central', async () => {
          makeSelector();
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );
          calls.length = 0;

          await expect(makeConnection().connect()).rejects.toMatchObject({
            type: ERROR_TYPE.RATE_LIMITED,
          });

          expect(calls).toEqual([]);
        });

        it('also pauses a connection to a single endpoint', async () => {
          makeSelector({ list: [A] });
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );
          calls.length = 0;

          await expect(makeConnection().connect()).rejects.toMatchObject({
            type: ERROR_TYPE.RATE_LIMITED,
          });
          expect(calls).toEqual([]);
        });

        it('pauses a connection with no selector at all', async () => {
          // there is no list to name hosts in, so whatever host the config gives refuses
          hosts = new Proxy({}, { get: () => 'refuses' });
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );
          calls.length = 0;

          await expect(makeConnection().connect()).rejects.toMatchObject({
            type: ERROR_TYPE.RATE_LIMITED,
          });
          expect(calls).toEqual([]);
        });

        it('lets calls that need a login fail during the pause instead of retrying it', async () => {
          makeSelector();
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );
          calls.length = 0;

          await expect(makeConnection().fetch('anything')).rejects.toMatchObject({
            type: ERROR_TYPE.RATE_LIMITED,
          });
          expect(calls).toEqual([]);
        });

        it('tries again once the pause has passed, and pauses for longer if refused again', async () => {
          makeSelector();
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );

          backoffNow += 120_000;
          calls.length = 0;
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );
          expect(loginsAt(A)).toBe(1);

          // the second pause is five times the first
          backoffNow += 120_000;
          await expect(makeConnection().connect()).rejects.toMatchObject({
            type: ERROR_TYPE.RATE_LIMITED,
          });
          backoffNow += 480_000;
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );
        });

        it('ends the pause and the schedule when a login succeeds', async () => {
          makeSelector();
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );

          backoffNow += 120_000;
          hosts[A] = 'live';
          await makeConnection().connect();

          // refused again later, the schedule starts over from the shortest pause
          hosts[A] = 'refuses';
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );
          backoffNow += 120_000;
          await expect(makeConnection().connect()).rejects.toBeProblemOfType(
            ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
          );
        });

        it('pauses after a lockout as well', async () => {
          hosts = { [A]: 'locked', [B]: 'live' };
          makeSelector();
          await expect(makeConnection().connect()).rejects.toMatchObject({
            type: ERROR_TYPE.RATE_LIMITED,
          });
          calls.length = 0;

          await expect(makeConnection().connect()).rejects.toMatchObject({
            type: ERROR_TYPE.RATE_LIMITED,
          });
          expect(calls).toEqual([]);
        });
      });

      it('does not pause for an endpoint that is merely unreachable', async () => {
        hosts = { [A]: 'down', [B]: 'down' };
        makeSelector();

        await expect(makeConnection().connect()).rejects.toMatchObject({
          type: ERROR_TYPE.REMOTE_UNREACHABLE,
        });

        hosts = { [A]: 'live', [B]: 'live' };
        await makeConnection().connect();
      });

      it('tries only the one endpoint when there is a single host', async () => {
        hosts[A] = 'refuses';
        makeSelector({ list: [A] });
        const connection = makeConnection();

        await expect(connection.connect()).rejects.toBeProblemOfType(
          ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
        );

        expect(calls.filter(call => call.path === 'login')).toHaveLength(1);
      });
    });

    describe('when the endpoint stops working', () => {
      it('walks the list and retries the call on the endpoint it lands on', async () => {
        const selector = makeSelector();
        const connection = makeConnection();
        await connection.connect();
        expect(selector.current()).toBe(A);

        hosts[A] = 'down';
        const result = await connection.fetch('anything');

        expect(result).toEqual({ answeredBy: B });
        expect(selector.current()).toBe(B);
        expect(connection.host).toBe(B);
        expect(loginsAt(B)).toBeGreaterThanOrEqual(1);
      });

      it('fails fast on the dead endpoint rather than spending the full backoff on it', async () => {
        makeSelector();
        const connection = makeConnection();
        await connection.connect();

        hosts[A] = 'down';
        await connection.fetch('anything');

        const attemptsAtA = calls.filter(
          call => call.origin === A && call.path === 'anything',
        ).length;
        expect(attemptsAtA).toBe(3);
      });

      it('gives up with the error when no endpoint answers', async () => {
        const selector = makeSelector();
        const connection = makeConnection();
        await connection.connect();

        hosts = { [A]: 'down', [B]: 'down' };

        await expect(connection.fetch('anything')).rejects.toMatchObject({
          type: ERROR_TYPE.REMOTE_UNREACHABLE,
        });
        expect(selector.current()).toBe(A);
      });

      it('does not move on for an error that comes from central itself', async () => {
        const selector = makeSelector();
        const connection = makeConnection();
        await connection.connect();
        fakeFetch.mockImplementationOnce(() => fakeProblem(new ValidationError()));

        await expect(connection.fetch('anything')).rejects.toBeProblemOfType(ERROR_TYPE.VALIDATION);

        expect(selector.current()).toBe(A);
        expect(calls.filter(call => call.path === 'login')).toHaveLength(1);
      });

      it('lets a session in progress fail rather than retrying it elsewhere', async () => {
        const selector = makeSelector();
        const connection = makeConnection();
        await connection.connect();
        selector.beginSession();

        hosts[A] = 'down';
        // no backoff only so the test does not wait out the full one a session's calls get
        await expect(connection.fetch('sync/abc/pull', { backoff: false })).rejects.toMatchObject({
          type: ERROR_TYPE.REMOTE_UNREACHABLE,
        });

        // nothing was probed during the session
        expect(selector.current()).toBe(A);
        expect(calls.filter(call => call.origin === B)).toHaveLength(0);

        // the first call after it looks for another endpoint
        selector.endSession();
        expect(await connection.fetch('anything')).toEqual({ answeredBy: B });
        expect(selector.current()).toBe(B);
      });

      it('keeps a session on its endpoint when the selector moves during it', async () => {
        const selector = makeSelector();
        const connection = makeConnection();
        await connection.connect();
        selector.beginSession();

        await selector.adopt([A, B], B);
        expect(await connection.fetch('sync/abc/pull')).toEqual({ answeredBy: A });

        selector.endSession();
        expect(await connection.fetch('anything')).toEqual({ answeredBy: B });
      });
    });

    describe('during a sync session, a login', () => {
      it('is retried on the same endpoint rather than walking to another', async () => {
        const selector = makeSelector();
        const connection = makeConnection();
        await connection.connect();
        selector.beginSession();

        // the session's token is rejected and the re-login is refused
        hosts[A] = 'refuses';
        fakeFetch.mockImplementationOnce(() => authInvalid);

        await expect(connection.fetch('sync/abc/pull')).rejects.toBeProblemOfType(
          ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
        );

        expect(selector.current()).toBe(A);
        expect(connection.host).toBe(A);
        expect(calls.filter(call => call.origin === B)).toHaveLength(0);
        selector.endSession();
      });
    });

    describe('in a process that follows the sync process', () => {
      it('neither probes other endpoints nor publishes one when its endpoint is down', async () => {
        const selector = makeSelector({ canProbe: false });
        const connection = makeConnection();

        hosts[A] = 'down';
        await expect(connection.fetch('anything', { backoff: false })).rejects.toMatchObject({
          type: ERROR_TYPE.REMOTE_UNREACHABLE,
        });

        expect(selector.current()).toBe(A);
        expect(calls.filter(call => call.origin === B)).toHaveLength(0);
        expect(publishedFacts).toEqual([]);
      });

      it('does not walk when its login is refused', async () => {
        const selector = makeSelector({ canProbe: false });
        const connection = makeConnection();

        hosts[A] = 'refuses';
        await expect(connection.connect()).rejects.toBeProblemOfType(
          ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
        );

        expect(selector.current()).toBe(A);
        expect(calls.filter(call => call.origin === B)).toHaveLength(0);
        expect(publishedFacts).toEqual([]);
      });

      it('still uses the endpoint the sync process chose', async () => {
        const selector = makeSelector({ canProbe: false });
        const connection = makeConnection();

        await selector.adopt([A, B], B);
        expect(await connection.fetch('anything')).toEqual({ answeredBy: B });
      });
    });

    describe('startSyncSession', () => {
      it('reports the endpoint in use', async () => {
        makeSelector({ inUse: B });
        const connection = makeConnection();
        fakeFetch.mockImplementation(async (url, config) => {
          if (new URL(url).pathname.endsWith('/sync')) {
            calls.push({ path: 'sync', body: config.body });
            return fakeSuccess({ status: 'waitingInQueue' });
          }
          return respond(url, config);
        });

        await connection.startSyncSession({ urgent: false, lastSyncedTick: 0 });

        const syncCall = calls.find(call => call.path === 'sync');
        expect(JSON.parse(syncCall.body)).toMatchObject({ endpoint: B });
      });

      it('reports the endpoint it landed on when it fails over while starting the session', async () => {
        makeSelector({ inUse: A });
        const connection = makeConnection();
        await connection.connect();
        hosts[A] = 'down';
        fakeFetch.mockImplementation(async (url, config) => {
          if (new URL(url).pathname.endsWith('/sync') && hosts[new URL(url).origin] === 'live') {
            calls.push({ origin: new URL(url).origin, path: 'sync', body: config.body });
            return fakeSuccess({ status: 'waitingInQueue' });
          }
          return respond(url, config);
        });

        await connection.startSyncSession({ urgent: false, lastSyncedTick: 0 });

        const syncCallsAtB = calls.filter(call => call.path === 'sync' && call.origin === B);
        expect(syncCallsAtB).toHaveLength(1);
        expect(JSON.parse(syncCallsAtB[0].body)).toMatchObject({ endpoint: B });
      });
    });
  });
});
