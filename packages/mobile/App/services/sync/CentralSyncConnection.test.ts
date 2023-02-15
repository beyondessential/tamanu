import { AuthenticationError, generalErrorMessage } from '../error';
import { CentralServerConnection } from './CentralServerConnection';
import { fetchWithTimeout } from './utils';

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  getResponseJsonSafely: jest.fn(),
  fetchWithTimeout: jest.fn(),
  sleepAsync: jest.fn(),
}));

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn().mockReturnValue('test-device-id'),
}));

jest.mock('/root/package.json', () => ({
  version: 'test-version',
}));

const mockSessionId = 'test-session-id';
const mockHost = 'http://test-host';

describe('CentralServerConnection', () => {
  let centralServerConnection;

  beforeEach(() => {
    centralServerConnection = new CentralServerConnection();
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
      const postSpy = jest.spyOn(centralServerConnection, 'post').mockResolvedValue(null);
      await centralServerConnection.startSyncSession();
      expect(postSpy).toBeCalledWith('sync', {}, {});
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
      const mockPageNumber = 2;
      const mockTotalPages = 4;
      const mockTableNames = ['table-1', 'table-2'];
      await centralServerConnection.push(
        mockSessionId,
        mockChanges,
        mockPageNumber,
        mockTotalPages,
        mockTableNames,
      );
      expect(postSpy).toBeCalledWith(
        expect.stringContaining(mockSessionId),
        { pageNumber: mockPageNumber, totalPages: mockTotalPages },
        {
          changes: mockChanges,
          tablesToInclude: mockTableNames,
        },
      );
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
        { email: mockEmail, password: mockPassword, deviceId: 'test-device-id' },
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
  describe('fetch', () => {
    it('should call fetch with correct parameters', async () => {
      (fetchWithTimeout as jest.Mock).mockResolvedValueOnce({
        json: () => 'test-result',
        status: 200,
        ok: true,
      });
      const mockPath = 'test-path';
      const mockQuery = { test: 'test-query' };
      const mockConfig = { test: 'test-config-key' };
      const mockToken = 'test-token';
      const mockHeaders = {
        Authorization: `Bearer ${mockToken}`,
        Accept: 'application/json',
        'X-Tamanu-Client': 'Tamanu Mobile',
        'X-Version': 'test-version',
      };
      centralServerConnection.setToken(mockToken);

      const fetchRes = await centralServerConnection.fetch(mockPath, mockQuery, mockConfig);
      expect(fetchWithTimeout).toBeCalledWith(`${mockHost}/v1/${mockPath}?test=${mockQuery.test}`, {
        headers: mockHeaders,
        ...mockConfig,
      });
      expect(fetchRes).toEqual('test-result');
    });
  });
});
