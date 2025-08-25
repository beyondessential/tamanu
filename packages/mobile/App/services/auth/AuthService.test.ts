import { CentralServerConnection } from '../sync';
import { AuthService } from './AuthService';
import { MODELS_MAP } from '~/models/modelsMap';
import { Raw } from 'typeorm';
import { VisibilityStatus } from '../../visibilityStatuses';
import {
  AuthenticationError,
  forbiddenFacilityMessage,
  invalidUserCredentialsMessage,
} from '../error';

// Mock dependencies
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

jest.mock('./bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('typeorm', () => ({
  Raw: jest.fn(),
}));

describe('AuthService', () => {
  let authService;
  let centralServerConnection;
  let mockUser;
  let mockUserModel;
  let mockReadConfig;
  let mockCompare;

  beforeEach(() => {
    // Setup mocks
    const { readConfig } = require('~/services/config');
    const { compare } = require('./bcrypt');
    mockReadConfig = readConfig;
    mockCompare = compare;

    // Setup mock user
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      localPassword: 'hashedPassword123',
      canAccessFacility: jest.fn().mockResolvedValue(true),
    };

    // Setup mock User model
    mockUserModel = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    // Setup AuthService
    centralServerConnection = new CentralServerConnection();
    authService = new AuthService();
    authService.models = {
      User: mockUserModel,
      ...MODELS_MAP,
    } as any;
    authService.centralServer = centralServerConnection;

    // Default mock returns
    mockReadConfig.mockResolvedValue('test-facility-id');
    mockCompare.mockResolvedValue(true);

    // Mock Raw function to return a structured object
    (Raw as jest.Mock).mockImplementation((sqlFn, params) => ({
      sql: sqlFn('email'),
      parameters: params,
    }));

    // Clear all mocks
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
    const generateAbilityForUser = jest.fn().mockReturnValue({});

    beforeEach(() => {
      generateAbilityForUser.mockClear();
    });

    describe('case insensitive email lookup', () => {
      it('should perform case insensitive email lookup using Raw SQL function', async () => {
        await authService.localSignIn(
          { email: 'TEST@EXAMPLE.COM', password: 'password123' },
          generateAbilityForUser
        );

        // Verify Raw function was called with correct parameters
        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: 'TEST@EXAMPLE.COM' }
        );

        // Verify the SQL function generates correct LOWER comparison
        const [sqlFn] = (Raw as jest.Mock).mock.calls[0];
        const generatedSql = sqlFn('email');
        expect(generatedSql).toBe('LOWER(email) = LOWER(:email)');

        // Verify findOne was called with Raw query
        expect(mockUserModel.findOne).toHaveBeenCalledWith({
          where: {
            email: {
              sql: 'LOWER(email) = LOWER(:email)',
              parameters: { email: 'TEST@EXAMPLE.COM' }
            },
            visibilityStatus: VisibilityStatus.Current,
          },
        });
      });

      it('should successfully sign in with uppercase email', async () => {
        const result = await authService.localSignIn(
          { email: 'TEST@EXAMPLE.COM', password: 'password123' },
          generateAbilityForUser
        );

        expect(result).toBe(mockUser);
        expect(mockUserModel.findOne).toHaveBeenCalled();
        expect(mockCompare).toHaveBeenCalledWith('password123', 'hashedPassword123');
        expect(mockUser.canAccessFacility).toHaveBeenCalledWith(
          'test-facility-id',
          {},
          authService.models
        );
      });

      it('should successfully sign in with mixed case email', async () => {
        const result = await authService.localSignIn(
          { email: 'TeSt@ExAmPlE.cOm', password: 'password123' },
          generateAbilityForUser
        );

        expect(result).toBe(mockUser);
        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: 'TeSt@ExAmPlE.cOm' }
        );
      });

      it('should successfully sign in with lowercase email', async () => {
        const result = await authService.localSignIn(
          { email: 'test@example.com', password: 'password123' },
          generateAbilityForUser
        );

        expect(result).toBe(mockUser);
        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: 'test@example.com' }
        );
      });
    });

    describe('error handling', () => {
      it('should throw error if no facility is configured', async () => {
        mockReadConfig.mockResolvedValue(null);

        await expect(
          authService.localSignIn(
            { email: 'test@example.com', password: 'password123' },
            generateAbilityForUser
          )
        ).rejects.toThrow('You need to first link this device to a facility before you can login offline.');

        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      it('should throw error if user has no localPassword', async () => {
        mockUser.localPassword = null;

        await expect(
          authService.localSignIn(
            { email: 'test@example.com', password: 'password123' },
            generateAbilityForUser
          )
        ).rejects.toThrow('You need to first login when connected to internet to use your account offline.');

        expect(mockUserModel.findOne).toHaveBeenCalled();
        expect(mockCompare).not.toHaveBeenCalled();
      });

      it('should throw error if user is not found', async () => {
        mockUserModel.findOne.mockResolvedValue(null);

        await expect(
          authService.localSignIn(
            { email: 'nonexistent@example.com', password: 'password123' },
            generateAbilityForUser
          )
        ).rejects.toThrow(invalidUserCredentialsMessage);

        expect(mockUserModel.findOne).toHaveBeenCalled();
        expect(mockCompare).not.toHaveBeenCalled();
      });

      it('should throw error if password does not match', async () => {
        mockCompare.mockResolvedValue(false);

        await expect(
          authService.localSignIn(
            { email: 'test@example.com', password: 'wrongpassword' },
            generateAbilityForUser
          )
        ).rejects.toThrow(invalidUserCredentialsMessage);

        expect(mockUserModel.findOne).toHaveBeenCalled();
        expect(mockCompare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
      });

      it('should throw error if user cannot access facility', async () => {
        mockUser.canAccessFacility.mockResolvedValue(false);

        await expect(
          authService.localSignIn(
            { email: 'test@example.com', password: 'password123' },
            generateAbilityForUser
          )
        ).rejects.toThrow(forbiddenFacilityMessage);

        expect(mockUserModel.findOne).toHaveBeenCalled();
        expect(mockCompare).toHaveBeenCalled();
        expect(mockUser.canAccessFacility).toHaveBeenCalled();
      });
    });

    describe('integration scenarios', () => {
      it('should handle case insensitive login during internet outage scenario', async () => {
        // Simulate a user trying different cases of their email during outage
        const emailVariations = [
          'user@hospital.com',
          'USER@HOSPITAL.COM',
          'User@Hospital.Com',
          'uSeR@hOsPiTaL.cOm'
        ];

        for (const email of emailVariations) {
          mockUserModel.findOne.mockClear();
          (Raw as jest.Mock).mockClear();

          const result = await authService.localSignIn(
            { email, password: 'password123' },
            generateAbilityForUser
          );

          expect(result).toBe(mockUser);
          expect(Raw).toHaveBeenCalledWith(
            expect.any(Function),
            { email }
          );
          expect(mockUserModel.findOne).toHaveBeenCalledWith({
            where: {
              email: {
                sql: 'LOWER(email) = LOWER(:email)',
                parameters: { email }
              },
              visibilityStatus: VisibilityStatus.Current,
            },
          });
        }
      });

      it('should maintain security by still checking password after case insensitive email lookup', async () => {
        // Even with case insensitive email, password should still be validated
        mockCompare.mockResolvedValue(false);

        await expect(
          authService.localSignIn(
            { email: 'TEST@EXAMPLE.COM', password: 'wrongpassword' },
            generateAbilityForUser
          )
        ).rejects.toThrow(invalidUserCredentialsMessage);

        // Verify case insensitive lookup was performed
        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: 'TEST@EXAMPLE.COM' }
        );
        
        // But password validation still failed
        expect(mockCompare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
      });
    });
  });
});
