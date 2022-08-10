import { VERSION_COMPATIBILITY_ERRORS } from 'shared/constants';
import {
  FacilityAndSyncVersionIncompatibleError,
  RemoteCallFailedError,
  BadAuthenticationError,
  InvalidOperationError,
} from 'shared/errors';

const { WebRemote } = jest.requireActual('../../app/sync/WebRemote');

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

const createRemote = () => {
  const remote = new WebRemote();
  remote.fetchImplementation = fetch;
  return remote;
};

describe('WebRemote', () => {
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
    it('authenticates against a remote sync-server', async () => {
      const remote = createRemote();
      fetch.mockReturnValueOnce(authSuccess);
      await remote.connect();
      expect(remote.token).toEqual('this-is-not-real');
    });

    it('throws a BadAuthenticationError if the credentials are invalid', async () => {
      const remote = createRemote();
      fetch.mockReturnValueOnce(authInvalid);
      await expect(remote.connect()).rejects.toThrow(BadAuthenticationError);
    });

    it('throws a FacilityAndSyncVersionIncompatibleError with an appropriate message if the client version is too low', async () => {
      const remote = createRemote();
      fetch.mockReturnValueOnce(clientVersionLow);
      await expect(remote.connect()).rejects.toThrow(/please upgrade.*v1\.0\.0/i);
      fetch.mockReturnValueOnce(clientVersionLow);
      await expect(remote.connect()).rejects.toThrow(FacilityAndSyncVersionIncompatibleError);
    });

    it('throws a FacilityAndSyncVersionIncompatibleError with an appropriate message if the client version is too high', async () => {
      const remote = createRemote();
      fetch.mockReturnValueOnce(clientVersionHigh);
      await expect(remote.connect()).rejects.toThrow(/only supports up to v2\.0\.0/i);
      fetch.mockReturnValueOnce(clientVersionHigh);
      await expect(remote.connect()).rejects.toThrow(FacilityAndSyncVersionIncompatibleError);
    });

    it('throws a RemoteCallFailedError if any other server error is returned', async () => {
      const remote = createRemote();
      fetch.mockReturnValueOnce(authFailure);
      await expect(remote.connect()).rejects.toThrow(RemoteCallFailedError);
    });

    it('retrieves user data', async () => {
      const remote = createRemote();
      fetch
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(fakeSuccess({ displayName: 'Fake User' }));
      expect(await remote.whoami()).toMatchObject({ displayName: 'Fake User' });
    });

    it('retries if a token is invalid', async () => {
      const remote = createRemote();
      fetch
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(authInvalid)
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(fakeSuccess({ displayName: 'Fake User' }));
      expect(await remote.whoami()).toMatchObject({ displayName: 'Fake User' });
    });

    it('times out requests', async () => {
      jest.setTimeout(2000); // fail quickly
      jest.useFakeTimers();
      const remote = createRemote();
      fetch.mockImplementationOnce(fakeTimeout('fake timeout'));
      const connectPromise = remote.connect();
      jest.runAllTimers();
      await await expect(connectPromise).rejects.toThrow('fake timeout');
    });
  });

  describe('pull', () => {
    it('pulls records', async () => {
      const remote = createRemote();
      const body = {
        records: [{ id: 'abc' }],
        count: 1,
        requestedAt: 123456,
      };
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(fakeSuccess(body));
      expect(remote.pull('reference')).resolves.toEqual(body);
    });

    it('throws an error on an invalid response', async () => {
      const remote = createRemote();
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(fakeFailure(403));
      await expect(remote.pull('reference')).rejects.toThrow(RemoteCallFailedError);
    });
  });

  describe('push', () => {
    it('pushes records', async () => {
      const remote = createRemote();
      const body = {
        count: 1,
        requestedAt: 123456,
      };
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(fakeSuccess(body));
      expect(remote.push('reference', [{ id: 'abc' }])).resolves.toEqual(body);
    });

    it('throws an error on an invalid response', async () => {
      const remote = createRemote();
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(fakeFailure(403));
      await expect(remote.push('reference')).rejects.toThrow(RemoteCallFailedError);
    });
  });
});
