import { SERVER_TYPES, VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';
import {
  BadAuthenticationError,
  FacilityAndSyncVersionIncompatibleError,
  RemoteCallFailedError,
} from '@tamanu/shared/errors';

const { CentralServerConnection } = jest.requireActual('../../dist/sync/CentralServerConnection');

const fakeResponse = (response, body, headers = {}) => {
  const validBody = JSON.parse(JSON.stringify(body));
  return Promise.resolve({
    ...response,
    json: () => Promise.resolve(validBody),
    text: () => Promise.resolve(JSON.stringify(validBody)),
    headers: {
      get: key =>
        headers[key] ??
        {
          'x-tamanu-server': SERVER_TYPES.CENTRAL,
        }[key],
    },
  });
};
const fakeSuccess = body => fakeResponse({ status: 200, ok: true }, body);
const fakeFailure = (status, body = {}, headers = {}) =>
  fakeResponse({ status, ok: false }, body, headers);

describe('CentralServerConnection', () => {
  const authSuccess = fakeSuccess({
    token: 'this-is-not-real',
    user: {
      id: 'not-real',
      displayName: 'Not Real',
      email: 'notreal@example.com',
    },
  });
  const meSuccess = fakeSuccess({
    id: 'not-real',
    displayName: 'Not Real',
    email: 'notreal@example.com',
  });
  const authInvalid = fakeFailure(401);
  const authFailure = fakeFailure(503);
  const clientVersionLow = fakeFailure(
    400,
    {
      error: {
        message: VERSION_COMPATIBILITY_ERRORS.LOW,
        error: 'InvalidClientVersion',
      },
    },
    {
      'X-Min-Client-Version': '1.0.0',
      'X-Max-Client-Version': '2.0.0',
    },
  );
  const clientVersionHigh = fakeFailure(
    400,
    {
      error: {
        message: VERSION_COMPATIBILITY_ERRORS.HIGH,
        error: 'InvalidClientVersion',
      },
    },
    {
      'X-Min-Client-Version': '1.0.0',
      'X-Max-Client-Version': '2.0.0',
    },
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
      expect(token).toEqual('this-is-not-real');
      expect(user).toMatchObject({ id: 'not-real' });
    });

    it('throws a BadAuthenticationError if the credentials are invalid', async () => {
      fetch.mockReturnValueOnce(authInvalid);
      await expect(centralServer.connect()).rejects.toThrow(BadAuthenticationError);
    });

    it('throws a FacilityAndSyncVersionIncompatibleError with an appropriate message if the client version is too low', async () => {
      fetch.mockReturnValueOnce(clientVersionLow);
      await expect(centralServer.connect()).rejects.toThrow(/is out of date/i);
      fetch.mockReturnValueOnce(clientVersionLow);
      await expect(centralServer.connect()).rejects.toThrow(
        FacilityAndSyncVersionIncompatibleError,
      );
    });

    it('throws a FacilityAndSyncVersionIncompatibleError with an appropriate message if the client version is too high', async () => {
      fetch.mockReturnValueOnce(clientVersionHigh);
      await expect(centralServer.connect()).rejects.toThrow(/only supports up to v2\.0/i);
      fetch.mockReturnValueOnce(clientVersionHigh);
      await expect(centralServer.connect()).rejects.toThrow(
        FacilityAndSyncVersionIncompatibleError,
      );
    });

    it('throws a RemoteCallFailedError if any other server error is returned', async () => {
      fetch.mockReturnValueOnce(authFailure);
      await expect(centralServer.connect()).rejects.toThrow(RemoteCallFailedError);
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
