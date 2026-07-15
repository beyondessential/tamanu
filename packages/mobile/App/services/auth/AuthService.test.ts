import { CentralServerConnection } from '../sync';
import { AuthService } from './AuthService';
import { MODELS_MAP } from '~/models/modelsMap';
import { readConfig } from '~/services/config';
import { AuthenticationError, invalidUserCredentialsMessage } from '../error';

jest.mock('../sync/CentralServerConnection', () => ({
  CentralServerConnection: jest.fn().mockImplementation(() => ({
    emitter: {
      on: jest.fn(),
    },
    setToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearToken: jest.fn(),
    clearRefreshToken: jest.fn(),
  })),
}));

jest.mock('~/services/config', () => ({
  readConfig: jest.fn(),
  writeConfig: jest.fn(),
}));

describe('AuthService', () => {
  let authService;
  let centralServerConnection;

  beforeEach(() => {
    centralServerConnection = new CentralServerConnection();
    authService = new AuthService(MODELS_MAP, centralServerConnection);
    (CentralServerConnection as jest.Mock<CentralServerConnection>).mockClear();
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should start a session', () => {
      const mockToken = 'test-token';
      const mockRefreshToken = 'test-refresh-token';
      authService.startSession(mockToken, mockRefreshToken);
      expect(centralServerConnection.setToken).toHaveBeenCalledWith(mockToken);
      expect(centralServerConnection.setRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
    });
  });
  describe('endSession', () => {
    it('should end a session', () => {
      authService.endSession();
      expect(centralServerConnection.clearToken).toHaveBeenCalled();
      expect(centralServerConnection.clearRefreshToken).toHaveBeenCalled();
    });
  });

  describe('localSignIn', () => {
    it('should raise an authentication error when no user matches the given email', async () => {
      (readConfig as jest.Mock).mockResolvedValue('test-facility-id');
      const models = { ...MODELS_MAP, User: { findOne: jest.fn().mockResolvedValue(null) } };
      authService = new AuthService(models, centralServerConnection);

      await expect(
        authService.localSignIn(
          { email: 'unknown@example.com', password: 'password' },
          jest.fn(),
        ),
      ).rejects.toThrow(new AuthenticationError(invalidUserCredentialsMessage));
    });
  });
});
