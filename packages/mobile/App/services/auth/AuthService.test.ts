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
  });

  describe('saveLocalUser', () => {
    let mockHash;
    let mockUserCreate;

    beforeEach(() => {
      const { hash } = require('./bcrypt');
      mockHash = hash;
      mockHash.mockResolvedValue('hashedPassword123');

      mockUserCreate = {
        save: jest.fn().mockResolvedValue({
          id: 'new-user-id',
          email: 'newuser@example.com',
          save: jest.fn(),
        }),
      };

      mockUserModel.create = jest.fn().mockReturnValue(mockUserCreate);
      mockUser.save = jest.fn().mockResolvedValue(mockUser);
    });

    describe('case insensitive email lookup', () => {
      it('should use case insensitive lookup to find existing user', async () => {
        const userData = { email: 'TEST@EXAMPLE.COM', displayName: 'Test User' };
        
        await authService.saveLocalUser(userData, 'password123');

        // Verify Raw function was called with correct parameters for case insensitive lookup
        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: 'TEST@EXAMPLE.COM' }
        );

        // Verify findOne was called with Raw query
        expect(mockUserModel.findOne).toHaveBeenCalledWith({
          where: {
            email: {
              sql: 'LOWER(email) = LOWER(:email)',
              parameters: { email: 'TEST@EXAMPLE.COM' }
            },
          },
        });
      });

      it('should find existing user regardless of email case', async () => {
        // User exists in database with lowercase email
        mockUser.email = 'test@example.com';
        
        // Try to save with uppercase email
        const userData = { email: 'TEST@EXAMPLE.COM', displayName: 'Test User' };
        
        const result = await authService.saveLocalUser(userData, 'password123');

        expect(result).toBe(mockUser);
        expect(mockUserModel.create).not.toHaveBeenCalled();
        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: 'TEST@EXAMPLE.COM' }
        );
      });

      it('should prevent duplicate user creation when email case differs', async () => {
        // Simulate user signed in online with User@example.com 
        // and later tries to sign in with user@example.com
        const onlineUserData = { email: 'User@Example.Com', displayName: 'Test User' };
        const offlineUserData = { email: 'user@example.com', displayName: 'Test User' };

        // First save (online signin)
        const firstResult = await authService.saveLocalUser(onlineUserData, 'password123');
        expect(firstResult).toBe(mockUser);

        // Clear mocks for second call
        mockUserModel.findOne.mockClear();
        (Raw as jest.Mock).mockClear();

        // Second save (offline signin with different case)
        const secondResult = await authService.saveLocalUser(offlineUserData, 'password123');
        
        // Should find the same user due to case insensitive lookup
        expect(secondResult).toBe(mockUser);
        expect(mockUserModel.create).not.toHaveBeenCalled();
        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: 'user@example.com' }
        );
      });

      it('should create new user when no existing user found (case insensitive)', async () => {
        mockUserModel.findOne.mockResolvedValue(null);
        const newUser = { id: 'new-user-id', email: 'newuser@example.com', save: jest.fn() };
        mockUserCreate.save.mockResolvedValue(newUser);

        const userData = { email: 'NewUser@Example.Com', displayName: 'New User' };
        
        const result = await authService.saveLocalUser(userData, 'password123');

        expect(result).toBe(newUser);
        expect(mockUserModel.create).toHaveBeenCalledWith(userData);
        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: 'NewUser@Example.Com' }
        );
      });
    });

    describe('password hashing integration', () => {
      it('should hash and save password asynchronously for existing user', async () => {
        const userData = { email: 'test@example.com', displayName: 'Test User' };
        
        const result = await authService.saveLocalUser(userData, 'password123');

        expect(result).toBe(mockUser);
        
        // Wait for async password hashing to complete
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(mockHash).toHaveBeenCalledWith('password123');
        expect(mockUser.save).toHaveBeenCalled();
        expect(mockUser.localPassword).toBe('hashedPassword123');
      });

      it('should hash and save password asynchronously for new user', async () => {
        mockUserModel.findOne.mockResolvedValue(null);
        const newUser = { id: 'new-user-id', email: 'newuser@example.com', save: jest.fn() };
        mockUserCreate.save.mockResolvedValue(newUser);

        const userData = { email: 'newuser@example.com', displayName: 'New User' };
        
        const result = await authService.saveLocalUser(userData, 'password123');

        expect(result).toBe(newUser);
        
        // Wait for async password hashing to complete
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(mockHash).toHaveBeenCalledWith('password123');
        expect(newUser.save).toHaveBeenCalled();
        expect(newUser.localPassword).toBe('hashedPassword123');
      });
    });

    describe('edge cases', () => {
      it('should handle undefined email gracefully', async () => {
        const userData = { displayName: 'Test User' };
        
        await expect(
          authService.saveLocalUser(userData, 'password123')
        ).rejects.toThrow();

        expect(Raw).toHaveBeenCalledWith(
          expect.any(Function),
          { email: undefined }
        );
      });
    });
  });
});
