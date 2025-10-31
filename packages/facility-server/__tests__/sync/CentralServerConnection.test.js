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

const { CentralServerConnection } = jest.requireActual('../../dist/sync/CentralServerConnection');

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
});
