import { ERROR_TYPE } from '@tamanu/errors';

import { FacilitySyncConnection } from '../../app/sync/FacilitySyncConnection';

const fakeSuccess = body =>
  Promise.resolve({
    status: 200,
    ok: true,
    json: () => Promise.resolve(body),
  });

// What `fetch` rejects with when nothing is listening: a bare TypeError carrying the
// real reason in `cause`. A hostname resolving to several addresses (`localhost` is both
// `::1` and `127.0.0.1`) gets one error per address, wrapped in an AggregateError.
const transportFailure = cause => {
  const error = new TypeError('fetch failed');
  error.cause = cause;
  return Promise.reject(error);
};
const connectionRefused = address => transportFailure(new Error(`connect ECONNREFUSED ${address}`));
const connectionRefusedOnEveryAddress = (...addresses) =>
  transportFailure(
    new AggregateError(addresses.map(each => new Error(`connect ECONNREFUSED ${each}`))),
  );

describe('FacilitySyncConnection', () => {
  let connection;
  let fetchMock;

  beforeEach(() => {
    connection = new FacilitySyncConnection();
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('sends no content type when there is no body', async () => {
    fetchMock.mockReturnValueOnce(fakeSuccess({ isSyncRunning: false }));

    await connection.getSyncStatus();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({ Accept: 'application/json' });
  });

  it('retries a trigger when the sync process is not yet reachable', async () => {
    fetchMock
      .mockReturnValueOnce(connectionRefused('127.0.0.1:4100'))
      .mockReturnValueOnce(fakeSuccess({ enabled: true, ran: true }));

    await expect(connection.runSync()).resolves.toEqual({ enabled: true, ran: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports the address it tried and why it failed once retries are exhausted', async () => {
    fetchMock.mockReturnValue(connectionRefused('127.0.0.1:4100'));

    const error = await connection.runSync().catch(caught => caught);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(error.type).toEqual(ERROR_TYPE.REMOTE_UNREACHABLE);
    expect(error.message).toContain(connection.host);
    expect(error.message).toContain('connect ECONNREFUSED 127.0.0.1:4100');
    expect(error.message).not.toEqual('fetch failed');
  });

  it('reports every address tried when the host resolves to several', async () => {
    fetchMock.mockReturnValue(connectionRefusedOnEveryAddress('::1:4100', '127.0.0.1:4100'));

    const error = await connection.getSyncStatus().catch(caught => caught);

    expect(error.message).toContain('connect ECONNREFUSED ::1:4100');
    expect(error.message).toContain('connect ECONNREFUSED 127.0.0.1:4100');
  });
});
