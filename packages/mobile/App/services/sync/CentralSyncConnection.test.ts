import { AuthenticationError, generalErrorMessage } from '../error';
import { CentralServerConnection } from './CentralServerConnection';

jest.mock('./utils', () => ({
  callWithBackoff: jest.fn(),
  getResponseJsonSafely: jest.fn(),
  fetchWithTimeout: jest.fn(),
  sleepAsync: jest.fn(),
}));

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn().mockReturnValue('test-device-id'),
}));

const mockSessionId = 'test-session-id';

describe('CentralServerConnection', () => {
  let centralServerConnection;

  beforeEach(() => {
    centralServerConnection = new CentralServerConnection();
    centralServerConnection.connect('http://test-host');
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
});
