//! This test is split because it is leaky: when run among other tests in a
//! common file, it leaks its mocks and causes other tests to fail or be flaky.

import { CentralConnectionStatus } from '~/types';
import { CentralServerConnection } from './CentralServerConnection';
import { fetchWithTimeout } from './utils';
import { Problem, InvalidCredentialError } from '@tamanu/errors';

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  fetchWithTimeout: jest.fn(),
  sleepAsync: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-device-id'),
}));

jest.mock('/root/package.json', () => ({
  version: 'test-version',
}));

const mockFetchWithTimeout = fetchWithTimeout as jest.MockedFunction<any>;
const mockHost = 'http://test-host';

const getHeadersWithToken = (token: string): any => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'X-Tamanu-Client': 'Tamanu Mobile',
  'X-Version': 'test-version',
});

describe('CentralServerConnection', () => {
  let centralServerConnection: CentralServerConnection;

  beforeEach(() => {
    centralServerConnection = new CentralServerConnection();
    centralServerConnection.emitter = {
      emit: jest.fn(),
    };
    centralServerConnection.connect(mockHost);
    jest.clearAllMocks();
  });

  it('should invoke itself after invalid token and refresh endpoint', async () => {
    const refreshSpy = jest.spyOn(centralServerConnection, 'refresh');
    const fetchSpy = jest.spyOn(centralServerConnection, 'fetch');
    const mockToken = 'test-token';
    const mockRefreshToken = 'test-refresh-token';
    const mockNewToken = 'test-new-token';
    const mockNewRefreshToken = 'test-new-refresh-token';

    centralServerConnection.setToken(mockToken);
    centralServerConnection.setRefreshToken(mockRefreshToken);
    /**
     * Mock three calls to fetchWithTimeout:
     * 1. First call to fetchWithTimeout will return a 401 for invalid token
     * 2. Second call to fetchWithTimeout will be refresh endpoint return a 200 with new tokens
     * 3. Third call to fetchWithTimeout will be the original fetch call with new token
     */
    mockFetchWithTimeout
      .mockResolvedValueOnce(Problem.fromError(new InvalidCredentialError()).intoResponse())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            token: mockNewToken,
            refreshToken: mockNewRefreshToken,
          }),
          { status: 200, statusText: 'OK' },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify('test-result-refresh'), { status: 200, statusText: 'OK' }),
      );
    const mockPath = 'test-path';
    await centralServerConnection.fetch(mockPath, {}, {});
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    expect(fetchWithTimeout).toHaveBeenNthCalledWith(1, `${mockHost}/api/${mockPath}`, {
      headers: getHeadersWithToken(mockToken),
    });
    expect(centralServerConnection.emitter.emit).toHaveBeenNthCalledWith(
      1,
      'statusChange',
      CentralConnectionStatus.Disconnected,
    );
    expect(fetchWithTimeout).toHaveBeenNthCalledWith(2, `${mockHost}/api/refresh`, {
      headers: { ...getHeadersWithToken(mockToken), 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        refreshToken: mockRefreshToken,
        deviceId: 'mobile-test-device-id',
      }),
    });
    expect(centralServerConnection.emitter.emit).toHaveBeenNthCalledWith(
      2,
      'statusChange',
      CentralConnectionStatus.Connected,
    );
    expect(fetchWithTimeout).toHaveBeenNthCalledWith(3, `${mockHost}/api/${mockPath}`, {
      headers: getHeadersWithToken(mockNewToken),
    });
    // Check that the fetch would not recursively call itself again on failure post refresh
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      'refresh',
      {},
      {
        body: JSON.stringify({
          refreshToken: mockRefreshToken,
          deviceId: 'mobile-test-device-id',
        }),
        skipAttemptRefresh: true,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        backoff: {
          maxAttempts: 1,
        },
      },
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      mockPath,
      {},
      {
        skipAttemptRefresh: true,
      },
    );
  });
});
