import { CentralConnectionStatus } from '~/types';
import {
  AuthenticationError,
  generalErrorMessage,
  invalidTokenMessage,
  OutdatedVersionError,
} from '../error';
import { CentralServerConnection } from './CentralServerConnection';
import axios from 'axios';
import { sleepAsync } from './utils';
import { ERROR_TYPE } from '@tamanu/errors';

jest.mock('~/infra/db', () => ({
  Database: {
    client: {
      query: jest.fn(),
    },
  },
}));

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  sleepAsync: jest.fn(),
}));

jest.mock('axios');

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-device-id'),
}));

jest.mock('/root/package.json', () => ({
  version: 'test-version',
}));

const mockAxiosRequest = jest.fn();
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
  let centralServerConnection: CentralServerConnection;

  beforeEach(() => {
    (axios.create as unknown as jest.Mock).mockReturnValue({ request: mockAxiosRequest });
    mockAxiosRequest.mockReset();
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
      expect(deleteSpy).toHaveBeenCalledWith(expect.stringContaining(mockSessionId), {});
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
      expect(postSpy).toHaveBeenCalled();
      expect(pollUntilTrueSpy).toHaveBeenCalledWith(expect.stringContaining(mockSessionId));
      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining(mockSessionId), {});
      expect(startSyncSessionRes).toEqual({ sessionId: mockSessionId, startedAtTick: 1 });
    });
  });
  describe('pull', () => {
    it('should call get with correct parameters', async () => {
      const getSpy = jest.spyOn(centralServerConnection, 'get').mockResolvedValue(null);
      await centralServerConnection.pull(mockSessionId, 1, 'test-from-id');
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining(mockSessionId),
        {
          fromId: 'test-from-id',
          limit: 1,
        },
        { timeout: expect.any(Number) },
      );
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
      expect(postSpy).toHaveBeenCalledWith(
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
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining(mockSessionId),
        {},
        { tablesToInclude: mockTablesToInclude, deviceId: 'mobile-test-device-id' },
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
      expect(postSpy).toHaveBeenCalledWith(
        'login',
        {},
        {
          email: mockEmail,
          password: mockPassword,
          deviceId: 'mobile-test-device-id',
          scopes: ['sync_client'],
        },
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

      await expect(centralServerConnection.login(mockEmail, mockPassword)).rejects.toThrow(
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

      expect(postSpy).toHaveBeenCalledWith(
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
      expect(centralServerConnection.emitter.emit).toHaveBeenCalledWith(
        'statusChange',
        CentralConnectionStatus.Connected,
      );
      expect(setTokenSpy).toHaveBeenCalledWith(mockToken);
      expect(setRefreshTokenSpy).toHaveBeenCalledWith(mockNewRefreshToken);
    });
    it('should throw an error if token or refreshToken are not defined', async () => {
      const mockRefreshToken = 'test-refresh-token';
      jest.spyOn(centralServerConnection, 'post').mockResolvedValueOnce({
        refreshToken: mockRefreshToken,
      });

      await expect(centralServerConnection.refresh()).rejects.toThrow(
        new AuthenticationError(generalErrorMessage),
      );
    });
  });
  describe('fetch', () => {
    it('should call fetch with correct parameters', async () => {
      mockAxiosRequest.mockResolvedValueOnce({ data: 'test-result-correct' });
      const mockPath = 'test-path';
      const mockQuery = { test: 'test-query' };
      const mockConfig = { test: 'test-config-key' };
      const mockToken = 'test-token';
      const mockHeaders = getHeadersWithToken(mockToken);
      centralServerConnection.setToken(mockToken);

      const fetchRes = await centralServerConnection.fetch(mockPath, mockQuery, mockConfig);

      expect(mockAxiosRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${mockHost}/api/${mockPath}`,
          params: mockQuery,
          headers: mockHeaders,
          test: 'test-config-key',
        }),
      );

      expect(fetchRes).toEqual('test-result-correct');
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
       * Mock three calls to axios:
       * 1. First call to request will reject with a 401 for invalid token
       * 2. Second call will be refresh endpoint returning new tokens
       * 3. Third call will be the original request with new token
       */
      mockAxiosRequest
        .mockRejectedValueOnce({
          response: {
            data: {
              status: 401,
              type: ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
              title: 'Invalid token',
            },
          },
        })
        .mockResolvedValueOnce({ data: { token: mockNewToken, refreshToken: mockNewRefreshToken } })
        .mockResolvedValueOnce({ data: 'test-result' });
      const mockPath = 'test-path';
      await centralServerConnection.fetch(mockPath, {}, {});
      expect(refreshSpy).toHaveBeenCalledTimes(1);

      expect(mockAxiosRequest).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          url: `${mockHost}/api/${mockPath}`,
          headers: getHeadersWithToken(mockToken),
        }),
      );
      expect(centralServerConnection.emitter.emit).toHaveBeenNthCalledWith(
        1,
        'statusChange',
        CentralConnectionStatus.Disconnected,
      );
      expect(mockAxiosRequest).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          url: `${mockHost}/api/refresh`,
          method: 'POST',
          headers: { ...getHeadersWithToken(mockToken), 'Content-Type': 'application/json' },
          data: {
            refreshToken: mockRefreshToken,
            deviceId: 'mobile-test-device-id',
          },
        }),
      );
      expect(centralServerConnection.emitter.emit).toHaveBeenNthCalledWith(
        2,
        'statusChange',
        CentralConnectionStatus.Connected,
      );
      expect(mockAxiosRequest).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          url: `${mockHost}/api/${mockPath}`,
          headers: getHeadersWithToken(mockNewToken),
        }),
      );
      // Check that the fetch would not recursively call itself again on failure post refresh
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        'refresh',
        {},
        {
          body: {
            refreshToken: mockRefreshToken,
            deviceId: 'mobile-test-device-id',
          },
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
          backoff: undefined,
          body: undefined,
          headers: undefined,
          method: 'GET',
          timeout: undefined,
        },
      );
    });

    it('should not call refresh if skipAttemptRefresh is true', async () => {
      mockAxiosRequest.mockRejectedValueOnce({
        response: {
          data: { status: 401, type: ERROR_TYPE.AUTH_TOKEN_INVALID, title: 'Invalid token' },
        },
      });
      const refreshSpy = jest.spyOn(centralServerConnection, 'refresh');
      await expect(
        centralServerConnection.fetch('test-path', {}, { skipAttemptRefresh: true }),
      ).rejects.toThrow(new AuthenticationError(invalidTokenMessage));
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should throw an error with updateUrl if version is outdated', async () => {
      const mockUpdateUrl = 'test-update-url';
      mockAxiosRequest.mockRejectedValueOnce({
        response: {
          data: {
            status: 400,
            type: ERROR_TYPE.CLIENT_INCOMPATIBLE,
            title: 'Client incompatible',
            extra: {
              updateUrl: mockUpdateUrl,
            },
          },
        },
      });
      await expect(centralServerConnection.fetch('test-path', {}, {})).rejects.toThrow(
        new OutdatedVersionError(mockUpdateUrl),
      );
    });
  });
});
