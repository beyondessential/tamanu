import { VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';
import {
  FacilityAndSyncVersionIncompatibleError,
  RemoteCallFailedError,
  BadAuthenticationError,
} from 'shared/errors';
import { createTestContext } from '../utilities';

const { CentralServerConnection } = jest.requireActual('../../app/sync/CentralServerConnection');

const fakeResponse = (response, body, headers) => {
  const validBody = JSON.parse(JSON.stringify(body));
  return Promise.resolve({
    ...response,
    json: () => Promise.resolve(validBody),
    headers: {
      get: key => headers[key],
    },
  });
};
const fakeSuccess = body => fakeResponse({ status: 200, ok: true }, body);
const fakeFailure = (status, body = {}, headers = {}) =>
  fakeResponse({ status, ok: false }, body, headers);

const fakeTimeout = message => (url, opts) =>
  new Promise((resolve, reject) => {
    // TODO: import AbortError from node-fetch once we're on v3.0
    class AbortError extends Error {}
    opts.signal.addEventListener('abort', () => reject(new AbortError(message)));
  });

const fetch = jest.fn();

describe('CentralServerConnection', () => {
  const authSuccess = fakeSuccess({
    token: 'this-is-not-real',
    user: {
      id: 'not-real',
      displayName: 'Not Real',
      email: 'notreal@example.com',
    },
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
    let ctx;
    let centralServer;
    beforeAll(async () => {
      ctx = await createTestContext();
    });

    afterAll(async () => {
      await ctx.close();
    });

    beforeEach(() => {
      centralServer = new CentralServerConnection({ deviceId: 'test', settings: ctx.settings });
      centralServer.fetchImplementation = fetch;
    });

    it('authenticates against a central server', async () => {
      fetch.mockReturnValueOnce(authSuccess);
      await centralServer.connect();
      expect(centralServer.token).toEqual('this-is-not-real');
    });

    it('throws a BadAuthenticationError if the credentials are invalid', async () => {
      fetch.mockReturnValueOnce(authInvalid);
      await expect(centralServer.connect()).rejects.toThrow(BadAuthenticationError);
    });

    it('throws a FacilityAndSyncVersionIncompatibleError with an appropriate message if the client version is too low', async () => {
      fetch.mockReturnValueOnce(clientVersionLow);
      await expect(centralServer.connect()).rejects.toThrow(/please upgrade.*v1\.0\.0/i);
      fetch.mockReturnValueOnce(clientVersionLow);
      await expect(centralServer.connect()).rejects.toThrow(
        FacilityAndSyncVersionIncompatibleError,
      );
    });

    it('throws a FacilityAndSyncVersionIncompatibleError with an appropriate message if the client version is too high', async () => {
      fetch.mockReturnValueOnce(clientVersionHigh);
      await expect(centralServer.connect()).rejects.toThrow(/only supports up to v2\.0\.0/i);
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
        .mockReturnValueOnce(fakeSuccess({ displayName: 'Fake User' }));
      expect(await centralServer.whoami()).toMatchObject({ displayName: 'Fake User' });
    });

    it('retries if a token is invalid', async () => {
      fetch
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(authInvalid)
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(fakeSuccess({ displayName: 'Fake User' }));
      expect(await centralServer.whoami()).toMatchObject({ displayName: 'Fake User' });
    });

    it('times out requests', async () => {
      jest.setTimeout(2000); // fail quickly
      jest.useFakeTimers();

      fetch.mockImplementationOnce(fakeTimeout('fake timeout'));
      const connectPromise = centralServer.connect();
      jest.runAllTimers();
      await await expect(connectPromise).rejects.toThrow('fake timeout');
    });
  });
});
