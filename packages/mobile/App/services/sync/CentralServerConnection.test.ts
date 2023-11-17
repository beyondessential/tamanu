import { CentralConnectionStatus } from '~/types';
import {
  AuthenticationError,
  generalErrorMessage,
  invalidTokenMessage,
  OutdatedVersionError,
} from '../error';
import { CentralServerConnection } from './CentralServerConnection';
import { fetchWithTimeout, sleepAsync } from './utils';

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  fetchWithTimeout: jest.fn(),
  sleepAsync: jest.fn(),
}));

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn().mockReturnValue('test-device-id'),
}));

jest.mock('/root/package.json', () => ({
  version: 'test-version',
}));

const mockFetchWithTimeout = fetchWithTimeout as jest.MockedFunction<any>;
const mockSleepAsync = sleepAsync as jest.MockedFunction<any>;

const mockSessionId = 'test-session-id';
const mockHost = 'http://test-host';

const getHeadersWithToken = (token: string): any => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'X-Tamanu-Client': 'Tamanu Mobile',
  'X-Version': 'test-version',
});

describe('CentralServerConnection', () => {
  let centralServerConnection;

  beforeEach(() => {
    centralServerConnection = new CentralServerConnection();
    centralServerConnection.emitter = {
      emit: jest.fn(),
    };
    centralServerConnection.connect(mockHost);
    jest.clearAllMocks();
  });

  describe('endSyncSession', () => {
    it('should call delete with correct parameters', async () => {
      const deleteSpy = jest.spyOn(centralServerConnection, 'delete').mockResolvedValue(null);
      await centralServerConnection.endSyncSession(mockSessionId);
      expect(deleteSpy).toBeCalledWith(expect.stringContaining(mockSessionId), {});
    });
  });
  describe('startSyncSession', () => {
    it('should call post with correct parameters', async () => {
      const pollUntilTrueSpy = jest
        .spyOn(centralServerConnection, 'pollUntilTrue')
        .mockResolvedValue(true);
      const postSpy = jest
        .spyOn(centralServerConnection, 'post')
        .mockResolvedValue({ sessionId: mockSessionId });
      const getSpy = jest
        .spyOn(centralServerConnection, 'get')
        .mockResolvedValue({ startedAtTick: 1 });
      const startSyncSessionRes = await centralServerConnection.startSyncSession({
        urgent: false,
        lastSyncedTick: -1,
      });
      expect(postSpy).toBeCalled();
      expect(pollUntilTrueSpy).toBeCalledWith(expect.stringContaining(mockSessionId));
      expect(getSpy).toBeCalledWith(expect.stringContaining(mockSessionId), {});
      expect(startSyncSessionRes).toEqual({ sessionId: mockSessionId, startedAtTick: 1 });
    });
  });
  describe('pull', () => {
    it('should call get with correct parameters', async () => {
      const getSpy = jest.spyOn(centralServerConnection, 'get').mockResolvedValue(null);
      await centralServerConnection.pull(mockSessionId, 1, 'test-from-id');
      expect(getSpy).toBeCalledWith(expect.stringContaining(mockSessionId), {
        fromId: 'test-from-id',
        limit: 1,
      });
    });
  });
  describe('push', () => {
    it('should call post with correct parameters', async () => {
      const postSpy = jest.spyOn(centralServerConnection, 'post').mockResolvedValue(null);
      const mockChanges = [
        {
          id: 'test-id-1',
          recordId: 'test-record-id',
          recordType: 'test-type-1',
          data: { id: 'test-id-1' },
        },
      ];
      await centralServerConnection.push(mockSessionId, mockChanges);
      expect(postSpy).toBeCalledWith(
        expect.stringContaining(mockSessionId),
        {},
        {
          changes: mockChanges,
        },
      );
    });
  });
  describe('completePush', () => {
    it('should call post with correct parameters', async () => {
      jest
        .spyOn(centralServerConnection, 'get')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      const mockTablesToInclude = ['test-table-1', 'test-table-2'];
      const postSpy = jest.spyOn(centralServerConnection, 'post').mockResolvedValue(null);
      await centralServerConnection.completePush(mockSessionId, mockTablesToInclude);
      expect(postSpy).toBeCalledWith(
        expect.stringContaining(mockSessionId),
        {},
        { tablesToInclude: mockTablesToInclude },
      );
      expect(mockSleepAsync).toHaveBeenCalledTimes(2);
    });
  });
  describe('login', () => {
    it('should return the result of data if token, refreshToken and user are defined', async () => {
      const mockResponse = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        user: {
          id: 'test-user-id',
        },
      };
      const postSpy = jest.spyOn(centralServerConnection, 'post').mockResolvedValue(mockResponse);
      const mockEmail = 'test@testemail.com';
      const mockPassword = 'test-password';

      const loginRes = await centralServerConnection.login(mockEmail, mockPassword);
      expect(postSpy).toBeCalledWith(
        'login',
        {},
        { email: mockEmail, password: mockPassword, deviceId: 'mobile-test-device-id' },
        {
          backoff: {
            maxAttempts: 1,
          },
        },
      );
      expect(loginRes).toEqual(mockResponse);
    });
    it('should throw an error if token, refreshToken or user are not defined', async () => {
      const mockResponseMissingRefreshToken = {
        token: 'test-token',
        user: {
          id: 'test-user-id',
        },
      };
      jest
        .spyOn(centralServerConnection, 'post')
        .mockResolvedValue(mockResponseMissingRefreshToken);
      const mockEmail = 'test@testemail.com';
      const mockPassword = 'test-password';

      expect(centralServerConnection.login(mockEmail, mockPassword)).rejects.toThrowError(
        new AuthenticationError(generalErrorMessage),
      );
    });
  });
  describe('refresh', () => {
    it('should set new token and refreshToken', async () => {
      const setTokenSpy = jest.spyOn(centralServerConnection, 'setToken');
      const setRefreshTokenSpy = jest.spyOn(centralServerConnection, 'setRefreshToken');
      const mockToken = 'test-token';
      const mockRefreshToken = 'test-refresh-token';
      const mockNewRefreshToken = 'test-new-refresh-token';

      centralServerConnection.setRefreshToken(mockRefreshToken);

      const postSpy = jest.spyOn(centralServerConnection, 'post').mockResolvedValue({
        token: mockToken,
        refreshToken: mockNewRefreshToken,
      });

      await centralServerConnection.refresh();

      expect(postSpy).toBeCalledWith(
        'refresh',
        {},
        { refreshToken: mockRefreshToken, deviceId: 'mobile-test-device-id' },
        {
          backoff: {
            maxAttempts: 1,
          },
          skipAttemptRefresh: true,
        },
      );
      expect(centralServerConnection.emitter.emit).toBeCalledWith('statusChange', CentralConnectionStatus.Connected)
      expect(setTokenSpy).toBeCalledWith(mockToken);
      expect(setRefreshTokenSpy).toBeCalledWith(mockNewRefreshToken);
    });
    it('should throw an error if token or refreshToken are not defined', async () => {
      const mockRefreshToken = 'test-refresh-token';
      jest.spyOn(centralServerConnection, 'post').mockResolvedValueOnce({
        refreshToken: mockRefreshToken,
      });

      expect(centralServerConnection.refresh()).rejects.toThrowError(
        new AuthenticationError(generalErrorMessage),
      );
    });
  });
  describe('fetch', () => {
    it('should call fetch with correct parameters', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        json: async () => 'test-result',
        status: 200,
        ok: true,
      });
      const mockPath = 'test-path';
      const mockQuery = { test: 'test-query' };
      const mockConfig = { test: 'test-config-key' };
      const mockToken = 'test-token';
      const mockHeaders = getHeadersWithToken(mockToken);
      centralServerConnection.setToken(mockToken);

      const fetchRes = await centralServerConnection.fetch(mockPath, mockQuery, mockConfig);
      expect(fetchWithTimeout).toBeCalledWith(`${mockHost}/v1/${mockPath}?test=${mockQuery.test}`, {
        headers: mockHeaders,
        ...mockConfig,
      });
      expect(fetchRes).toEqual('test-result');
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
        .mockResolvedValueOnce({
          status: 401,
        })
        .mockResolvedValueOnce({
          json: () => ({
            token: mockNewToken,
            refreshToken: mockNewRefreshToken,
          }),
          status: 200,
          ok: true,
        })
        .mockResolvedValueOnce({
          json: () => 'test-result',
          status: 200,
          ok: true,
        });
      const mockPath = 'test-path';
      await centralServerConnection.fetch(mockPath, {}, {});
      expect(refreshSpy).toHaveBeenCalledTimes(1);

      expect(fetchWithTimeout).toHaveBeenNthCalledWith(1, `${mockHost}/v1/${mockPath}`, {
        headers: getHeadersWithToken(mockToken),
      });
      expect(centralServerConnection.emitter.emit).toHaveBeenNthCalledWith(1, 'statusChange', CentralConnectionStatus.Disconnected)
      expect(fetchWithTimeout).toHaveBeenNthCalledWith(2, `${mockHost}/v1/refresh`, {
        headers: { ...getHeadersWithToken(mockToken), 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          refreshToken: mockRefreshToken,
          deviceId: 'mobile-test-device-id',
        }),
      });
      expect(centralServerConnection.emitter.emit).toHaveBeenNthCalledWith(2, 'statusChange',  CentralConnectionStatus.Connected)
      expect(fetchWithTimeout).toHaveBeenNthCalledWith(3, `${mockHost}/v1/${mockPath}`, {
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
    it('should not call refresh if skipAttemptRefresh is true', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        status: 401,
      });
      const refreshSpy = jest.spyOn(centralServerConnection, 'refresh');
      expect(
        centralServerConnection.fetch('test-path', {}, { skipAttemptRefresh: true }),
      ).rejects.toThrowError(new AuthenticationError(invalidTokenMessage));
      expect(refreshSpy).not.toHaveBeenCalled();
    });
    it('should throw an error with updateUrl if version is outdated', async () => {
      const mockUpdateUrl = 'test-update-url';
      mockFetchWithTimeout.mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          error: {
            name: 'InvalidClientVersion',
            updateUrl: 'test-update-url',
          },
        }),
      });
      expect(centralServerConnection.fetch('test-path', {}, {})).rejects.toThrowError(
        new OutdatedVersionError(mockUpdateUrl),
      );
    });
  });
});
