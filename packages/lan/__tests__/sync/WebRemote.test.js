import { BadAuthenticationError, InvalidOperationError } from 'shared/errors';

import { WebRemote } from '~/sync/WebRemote';

const fakeResponse = (response, body) => {
  const validBody = JSON.parse(JSON.stringify(body));
  return Promise.resolve({
    ...response,
    json: () => Promise.resolve(validBody),
  });
};
const fakeSuccess = body => fakeResponse({ status: 200, ok: true }, body);
const fakeFailure = (status, body = {}) => fakeResponse({ status, ok: false }, body);

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

  const createWebRemote = () => {
    const remote = new WebRemote();
    remote.fetchImplementation = jest.fn();
    return remote;
  };

  describe('authentication', () => {
    it('authenticates against a remote sync-server', async () => {
      const remote = createWebRemote();
      remote.fetchImplementation.mockReturnValueOnce(authSuccess);
      await remote.connect();
      expect(remote.token).toEqual('this-is-not-real');
    });

    it('throws a BadAuthenticationError if the credentials are invalid', async () => {
      const remote = createWebRemote();
      remote.fetchImplementation.mockReturnValueOnce(authInvalid);
      expect(remote.connect()).rejects.toThrow(BadAuthenticationError);
    });

    it('throws an InvalidOperationError if any other server error is returned', async () => {
      const remote = createWebRemote();
      remote.fetchImplementation.mockReturnValueOnce(authFailure);
      expect(remote.connect()).rejects.toThrow(InvalidOperationError);
    });

    it('retrieves user data', async () => {
      const remote = createWebRemote();
      remote.fetchImplementation.mockReturnValueOnce(authSuccess);
      await remote.connect();
      remote.fetchImplementation.mockReturnValueOnce(fakeSuccess({ displayName: 'Fake User' }));
      expect(await remote.whoami()).toMatchObject({ displayName: 'Fake User' });
    });

    it('retries if a token is invalid', async () => {
      const remote = createWebRemote();
      remote.fetchImplementation.mockReturnValueOnce(authSuccess);
      await remote.connect();
      remote.fetchImplementation
        .mockReturnValueOnce(authInvalid)
        .mockReturnValueOnce(authSuccess)
        .mockReturnValueOnce(fakeSuccess({ displayName: 'Fake User' }));
      expect(await remote.whoami()).toMatchObject({ displayName: 'Fake User' });
    });
  });

  describe('recieve', () => {
    it('receives records', async () => {
      const remote = createWebRemote();
      remote.fetchImplementation.mockReturnValueOnce(authSuccess);
      await remote.connect();
      remote.fetchImplementation.mockReturnValueOnce(
        fakeSuccess({
          records: [{ id: 'abc' }],
        }),
      );
      expect(remote.recieve('reference')).resolves.toContain({ id: 'abc' });
    });

    it('throws an error on an invalid response', async () => {
      const remote = createWebRemote();
      remote.fetchImplementation.mockReturnValueOnce(authSuccess);
      await remote.connect();
      remote.fetchImplementation.mockReturnValueOnce(fakeFailure(403));
      expect(remote.recieve('reference')).rejects.toThrow(InvalidOperationError);
    });
  });

  it.todo('sends records');
});
