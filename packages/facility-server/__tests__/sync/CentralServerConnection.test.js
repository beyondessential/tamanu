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
  ValidationError,
} from '@tamanu/errors';
import * as jose from 'jose';
import config from 'config';

const { CentralServerConnection } = (await vi.importActual('../../app/sync/CentralServerConnection'));

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
  // spec: SYNCHK#while-central-wakes
  describe('changes-pending check and waking central', () => {
    const { defaultRetryAfterSeconds, maxRetryAfterSeconds, maxTotalWaitSeconds } =
      config.sync.centralWake;
    const waking = retryAfter =>
      fakeFailure(503, {}, retryAfter === undefined ? {} : { 'retry-after': retryAfter });

    let fetch;
    let centralServer;

    // Calls made after the login and the user lookup that precede the first request
    const requestCalls = () => fetch.mock.calls.slice(2);

    beforeEach(() => {
      vi.useFakeTimers();
      fetch = vi.spyOn(global, 'fetch');
      centralServer = new CentralServerConnection({ deviceId: 'test' });
      centralServer.fetchImplementation = fetch;
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(meSuccess);
    });

    afterEach(() => {
      vi.useRealTimers();
      fetch.mockReset();
      fetch.mockRestore();
    });

    it('asks central for changes since the pull cursor', async () => {
      fetch.mockReturnValueOnce(fakeSuccess({ changesToPull: true }));

      expect(await centralServer.checkChangesPending(42)).toBe(true);

      const [[url]] = requestCalls();
      expect(new URL(url).pathname).toMatch(/\/sync\/pending$/);
      expect(new URL(url).searchParams.get('since')).toBe('42');
    });

    it('leaves the cursor out when the device has never pulled', async () => {
      fetch.mockReturnValueOnce(fakeSuccess({ changesToPull: false }));

      expect(await centralServer.checkChangesPending(undefined)).toBe(false);

      expect(new URL(requestCalls()[0][0]).searchParams.has('since')).toBe(false);
    });

    it('does not retry other failures', async () => {
      fetch.mockReturnValueOnce(fakeFailure(500));

      await expect(centralServer.checkChangesPending(1)).rejects.toBeProblemOfType(
        ERROR_TYPE.REMOTE,
      );
      expect(requestCalls()).toHaveLength(1);
    });

    it('waits for as long as Retry-After says, then asks again, for the check', async () => {
      fetch.mockReturnValueOnce(waking('7')).mockReturnValueOnce(waking('7'));
      fetch.mockReturnValueOnce(fakeSuccess({ changesToPull: false }));

      const answer = centralServer.checkChangesPending(1);
      await vi.advanceTimersByTimeAsync(6999);
      expect(requestCalls()).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(requestCalls()).toHaveLength(2);
      await vi.advanceTimersByTimeAsync(7000);

      expect(await answer).toBe(false);
      expect(requestCalls()).toHaveLength(3);
      // the retry still carries the cursor
      expect(new URL(requestCalls()[2][0]).searchParams.get('since')).toBe('1');
    });

    it('waits for as long as Retry-After says, then asks again, for session start', async () => {
      fetch.mockReturnValueOnce(waking('3'));
      fetch.mockReturnValueOnce(fakeSuccess({ status: 'waitingInQueue' }));

      const started = centralServer.startSyncSession({ urgent: false, lastSyncedTick: 5 });
      await vi.advanceTimersByTimeAsync(2999);
      expect(requestCalls()).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(await started).toEqual({ status: 'waitingInQueue' });
      expect(requestCalls()).toHaveLength(2);
      expect(JSON.parse(requestCalls()[1][1].body)).toMatchObject({ lastSyncedTick: 5 });
    });

    it('waits the default when a 503 has a Retry-After that is not a number of seconds', async () => {
      fetch.mockReturnValueOnce(waking('soon'));
      fetch.mockReturnValueOnce(fakeSuccess({ changesToPull: true }));

      const answer = centralServer.checkChangesPending(1);
      await vi.advanceTimersByTimeAsync(defaultRetryAfterSeconds * 1000 - 1);
      expect(requestCalls()).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(await answer).toBe(true);
    });

    // Only a Retry-After says the server is waking. An ordinary 503, from an overloaded central or
    // a proxy with nothing behind it, has to fail rather than park the sync for the wait budget.
    it.each([
      ['has no Retry-After', undefined],
      ['has an empty Retry-After', '  '],
    ])('fails at once when a 503 %s', async (_, retryAfter) => {
      fetch.mockReturnValueOnce(waking(retryAfter));

      await expect(centralServer.checkChangesPending(1)).rejects.toMatchObject({ status: 503 });
      expect(requestCalls()).toHaveLength(1);
    });

    it('fails when central answers the check with no flag', async () => {
      fetch.mockReturnValueOnce(fakeSuccess({}));

      await expect(centralServer.checkChangesPending(1)).rejects.toThrow('changesToPull');
    });

    it('caps a long Retry-After', async () => {
      fetch.mockReturnValueOnce(waking('100000'));
      fetch.mockReturnValueOnce(fakeSuccess({ changesToPull: true }));

      const answer = centralServer.checkChangesPending(1);
      await vi.advanceTimersByTimeAsync(maxRetryAfterSeconds * 1000);

      expect(await answer).toBe(true);
    });

    it('does not spin on a Retry-After of zero', async () => {
      fetch.mockReturnValueOnce(waking('0'));
      fetch.mockReturnValueOnce(fakeSuccess({ changesToPull: true }));

      const answer = centralServer.checkChangesPending(1);
      await vi.advanceTimersByTimeAsync(999);
      expect(requestCalls()).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(await answer).toBe(true);
    });

    // A scheduled sync logs in before it decides whether to check, so that login meets a waking
    // central too, and waiting for it is not a failed sync either.
    it('gives up with the last 503 once central has been waking for too long', async () => {
      fetch.mockReturnValue(waking('100000'));

      const outcome = expect(centralServer.checkChangesPending(1)).rejects.toMatchObject({
        status: 503,
      });
      await vi.advanceTimersByTimeAsync(maxTotalWaitSeconds * 1000 * 2);
      await outcome;

      // one request per wait that fitted within the bound, and the one that found no more fits
      expect(requestCalls()).toHaveLength(Math.floor(maxTotalWaitSeconds / maxRetryAfterSeconds) + 1);
    });
  });
});
