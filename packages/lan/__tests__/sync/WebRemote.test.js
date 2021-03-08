import { BadAuthenticationError, InvalidOperationError } from 'shared/errors';
import fetch from 'node-fetch';

import { WebRemote } from '~/sync/WebRemote';
jest.mock('node-fetch');

const fakeResponse = (response, body) => {
  const validBody = JSON.parse(JSON.stringify(body));
  return Promise.resolve({
    ...response,
    json: () => Promise.resolve(validBody),
  });
};
const fakeSuccess = body => fakeResponse({ status: 200, ok: true }, body);
const fakeFailure = (status, body = {}) => fakeResponse({ status, ok: false }, body);

const fakeTimeout = message => (url, opts) =>
  new Promise((resolve, reject) => {
    // TODO: import AbortError from node-fetch once we're on v3.0
    class AbortError extends Error {}
    opts.signal.addEventListener('abort', () => reject(new AbortError(message)));
  });

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

  describe('authentication', () => {
    it('authenticates against a remote sync-server', async () => {
      const remote = new WebRemote();
      fetch.mockReturnValueOnce(authSuccess);
      await remote.connect();
      expect(remote.token).toEqual('this-is-not-real');
    });

    it('throws a BadAuthenticationError if the credentials are invalid', async () => {
      const remote = new WebRemote();
      fetch.mockReturnValueOnce(authInvalid);
      expect(remote.connect()).rejects.toThrow(BadAuthenticationError);
    });

    it('throws an InvalidOperationError if any other server error is returned', async () => {
      const remote = new WebRemote();
      fetch.mockReturnValueOnce(authFailure);
      expect(remote.connect()).rejects.toThrow(InvalidOperationError);
    });

    it('retrieves user data', async () => {
      const remote = new WebRemote();
      fetch
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(fakeSuccess({ displayName: 'Fake User' }));
      expect(await remote.whoami()).toMatchObject({ displayName: 'Fake User' });
    });

    it('retries if a token is invalid', async () => {
      const remote = new WebRemote();
      fetch
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(authInvalid)
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(fakeSuccess({ displayName: 'Fake User' }));
      expect(await remote.whoami()).toMatchObject({ displayName: 'Fake User' });
    });

    it('times out requests', async () => {
      jest.useFakeTimers();
      const remote = new WebRemote();
      fetch.mockImplementationOnce(fakeTimeout('fake timeout'));
      const connectPromise = remote.connect();
      jest.runAllTimers();
      await expect(connectPromise).rejects.toThrow('fake timeout');
    });
  });

  describe('pull', () => {
    it('pulls records', async () => {
      const remote = new WebRemote();
      const body = {
        records: [{ id: 'abc' }],
        count: 1,
        requestedAt: 123456,
      };
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(fakeSuccess(body));
      expect(remote.pull('reference')).resolves.toEqual(body);
    });

    it('throws an error on an invalid response', async () => {
      const remote = new WebRemote();
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(fakeFailure(403));
      expect(remote.pull('reference')).rejects.toThrow(InvalidOperationError);
    });
  });

  describe('push', () => {
    it('pushes records', async () => {
      const remote = new WebRemote();
      const body = {
        count: 1,
        requestedAt: 123456,
      };
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(fakeSuccess(body));
      expect(remote.push('reference', [{ id: 'abc' }])).resolves.toEqual(body);
    });

    it('throws an error on an invalid response', async () => {
      const remote = new WebRemote();
      fetch.mockReturnValueOnce(authSuccess).mockReturnValueOnce(fakeFailure(403));
      expect(remote.push('reference')).rejects.toThrow(InvalidOperationError);
    });
  });
});
