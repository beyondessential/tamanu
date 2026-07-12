import {
  SERVER_TYPES,
  SYNC_STREAM_MESSAGE_KIND,
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

const { CentralServerConnection } = jest.requireActual('../../app/sync/CentralServerConnection');

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
      fetch = jest.spyOn(global, 'fetch');
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
      jest.setTimeout(2000); // fail quickly
      jest.useFakeTimers();
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
      jest.runAllTimers();
      await expect(connectPromise).rejects.toThrow('fake timeout');
    });
  });

  describe('stream', () => {
    let fetch;
    let centralServer;
    beforeEach(() => {
      fetch = jest.spyOn(global, 'fetch');
      centralServer = new CentralServerConnection({ deviceId: 'test' });
      centralServer.fetchImplementation = fetch;
    });
    afterEach(() => {
      fetch.mockReset();
      fetch.mockRestore();
    });

    // Tamanu Streaming Protocol frame:
    // | CR+LF (2 bytes) | kind (2 bytes) | length (4 bytes) | data ($length bytes) |
    const encodeFrame = (kind, payload) => {
      const data = Buffer.from(JSON.stringify(payload));
      const frame = Buffer.alloc(8 + data.length);
      frame.writeUInt16BE(0x0d0a, 0); // CR+LF; decoder skips these bytes
      frame.writeUInt16BE(kind, 2);
      frame.writeUInt32BE(data.length, 4);
      data.copy(frame, 8);
      return frame;
    };

    // A frame whose header advertises the full length but whose body is cut
    // short — i.e. the connection dropped mid-message.
    const encodeTruncatedFrame = (kind, payload) => {
      const full = encodeFrame(kind, payload);
      return full.subarray(0, full.length - 3);
    };

    // Fake a fetch Response whose body streams the given chunks (Buffers) and
    // then reports done, mirroring a WHATWG ReadableStream reader.
    const streamResponseOf = (...chunks) => {
      let index = 0;
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: {
          get: key => ({ 'x-tamanu-server': SERVER_TYPES.CENTRAL }[key.toLowerCase()]),
          has: () => false,
        },
        body: {
          getReader: () => ({
            read: () =>
              Promise.resolve(
                index < chunks.length
                  ? { done: false, value: chunks[index++] }
                  : { done: true, value: undefined },
              ),
          }),
        },
      });
    };

    const consume = async generator => {
      const messages = [];
      for await (const message of generator) {
        messages.push(message);
      }
      return messages;
    };

    const endpointFn = () => ({ endpoint: 'sync/1/pull/stream', query: {} });

    it('retries instead of yielding a message with an undefined body when the stream is truncated', async () => {
      // First attempt: one complete change, then a change whose body is cut off
      // by a dropped connection, then the reader reports done.
      const firstAttempt = streamResponseOf(
        Buffer.concat([
          encodeFrame(SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE, { id: 'record-1' }),
          encodeTruncatedFrame(SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE, {
            id: 'record-2-never-arrives',
          }),
        ]),
      );
      // Retry: the stream restarts cleanly and terminates with END.
      const secondAttempt = streamResponseOf(encodeFrame(SYNC_STREAM_MESSAGE_KIND.END, {}));

      fetch.mockReturnValueOnce(firstAttempt).mockReturnValueOnce(secondAttempt);

      const messages = await consume(
        centralServer.stream(endpointFn, { streamRetryInterval: 1 }),
      );

      // The stream must have restarted rather than surfacing the partial message.
      expect(fetch).toHaveBeenCalledTimes(2);

      // The truncated PULL_CHANGE must never be yielded with an undefined body:
      // the sync consumer does `records.push(message)` then reads `message.id`,
      // which would throw a TypeError and error the whole session.
      expect(messages.some(m => m.message === undefined)).toBe(false);

      const changes = messages.filter(m => m.kind === SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE);
      expect(changes).toHaveLength(1);
      expect(changes[0].message).toEqual({ id: 'record-1' });

      // And the stream still completes successfully via the retry.
      expect(messages[messages.length - 1].kind).toBe(SYNC_STREAM_MESSAGE_KIND.END);
    });
  });
});
