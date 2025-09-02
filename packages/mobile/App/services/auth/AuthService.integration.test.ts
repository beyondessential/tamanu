import { AuthService } from './AuthService';
import { Database } from '~/infra/db';
import { VisibilityStatus } from '../../visibilityStatuses';
import {
  AuthenticationError,
  forbiddenFacilityMessage,
  invalidUserCredentialsMessage,
} from '../error';
import { readConfig, writeConfig } from '~/services/config';

// Mock config
jest.mock('~/services/config', () => ({
  readConfig: jest.fn(),
  writeConfig: jest.fn(),
}));

const mockReadConfig = readConfig as jest.MockedFunction<typeof readConfig>;

// Mock central server connection
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

describe('AuthService Integration Tests', () => {
  let authService: AuthService;
  
  beforeAll(async () => {
    await Database.connect();
    authService = new AuthService();
    authService.models = Database.models;
  });

  beforeEach(async () => {
    // Clean up users table before each test
    await Database.models.User.getRepository().clear();
    
    // Set up default config mocks
    mockReadConfig.mockResolvedValue('test-facility-id');
    
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await Database.disconnect();
  });

  describe('saveLocalUser case insensitive behavior', () => {
    it('should find existing user with different email case', async () => {
      // Create a user with lowercase email
      const originalUser = await Database.models.User.createAndSaveOne({
        id: 'test-user-1',
        email: 'user@example.com',
        displayName: 'Test User',
        visibilityStatus: VisibilityStatus.Current,
      });

      // Try to save user with uppercase email
      const userData = {
        email: 'USER@EXAMPLE.COM',
        displayName: 'Test User Updated',
      };

      const result = await authService.saveLocalUser(userData, 'password123');

      // Should return the same user, not create a new one
      expect(result.id).toBe(originalUser.id);
      expect(result.email).toBe('user@example.com'); // Original email case preserved

      // Verify only one user exists in database
      const userCount = await Database.models.User.getRepository().count();
      expect(userCount).toBe(1);
    });

    it('should prevent duplicate user creation across multiple case variations', async () => {
      const emailVariations = [
        'user@hospital.com',
        'USER@HOSPITAL.COM',
        'User@Hospital.Com',
        'uSeR@hOsPiTaL.cOm'
      ];

      let firstUserId: string;

      // Save users with different email cases
      for (let i = 0; i < emailVariations.length; i++) {
        const userData = {
          email: emailVariations[i],
          displayName: `Test User ${i}`,
        };

        const result = await authService.saveLocalUser(userData, 'password123');

        if (i === 0) {
          firstUserId = result.id;
        } else {
          // All subsequent saves should return the same user
          expect(result.id).toBe(firstUserId);
        }
      }

      // Verify only one user exists in database
      const userCount = await Database.models.User.getRepository().count();
      expect(userCount).toBe(1);

      // Verify the user has the original email case
      const user = await Database.models.User.getRepository().findOne({
        where: { id: firstUserId }
      });
      expect(user.email).toBe('user@hospital.com'); // First variation
    });

    it('should create new user when no existing user found (case insensitive)', async () => {
      const userData = {
        email: 'NewUser@Example.Com',
        displayName: 'New User',
      };

      const result = await authService.saveLocalUser(userData, 'password123');

      expect(result.email).toBe('NewUser@Example.Com');
      expect(result.displayName).toBe('New User');

      // Verify user was created in database
      const userCount = await Database.models.User.getRepository().count();
      expect(userCount).toBe(1);
    });

    it('should hash and save local password asynchronously', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const result = await authService.saveLocalUser(userData, 'password123');

      // Initially localPassword should not be set yet (async operation)
      expect(result.localPassword).toBeUndefined();

      // Wait for async password hashing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload user from database
      const updatedUser = await Database.models.User.getRepository().findOne({
        where: { id: result.id }
      });

      expect(updatedUser.localPassword).toBeDefined();
      expect(updatedUser.localPassword).not.toBe('password123'); // Should be hashed
      expect(updatedUser.localPassword.length).toBeGreaterThan(20); // Bcrypt hash length
    });
  });

  describe('localSignIn case insensitive behavior', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user with a local password
      testUser = await Database.models.User.createAndSaveOne({
        id: 'test-user-1',
        email: 'user@example.com',
        displayName: 'Test User',
        visibilityStatus: VisibilityStatus.Current,
        localPassword: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789' // Mock bcrypt hash
      });

      // Mock bcrypt compare to return true for correct password
      jest.doMock('./bcrypt', () => ({
        compare: jest.fn().mockResolvedValue(true),
        hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
      }));

      // Mock user.canAccessFacility
      testUser.canAccessFacility = jest.fn().mockResolvedValue(true);
    });

    it('should login with different email cases', async () => {
      const generateAbilityForUser = jest.fn().mockReturnValue({});
      
      const emailVariations = [
        'user@example.com',
        'USER@EXAMPLE.COM',
        'User@Example.Com',
        'uSeR@eXaMpLe.CoM'
      ];

      for (const email of emailVariations) {
        const result = await authService.localSignIn(
          { email, password: 'password123' },
          generateAbilityForUser
        );

        expect(result.id).toBe(testUser.id);
        expect(result.email).toBe('user@example.com'); // Original email case
      }
    });

    it('should fail when user not found (case insensitive)', async () => {
      const generateAbilityForUser = jest.fn().mockReturnValue({});

      await expect(
        authService.localSignIn(
          { email: 'NONEXISTENT@EXAMPLE.COM', password: 'password123' },
          generateAbilityForUser
        )
      ).rejects.toThrow(invalidUserCredentialsMessage);
    });

    it('should fail when user has no localPassword', async () => {
      // Create user without localPassword
      const userWithoutPassword = await Database.models.User.createAndSaveOne({
        id: 'test-user-2',
        email: 'nopassword@example.com',
        displayName: 'No Password User',
        visibilityStatus: VisibilityStatus.Current,
        // localPassword intentionally omitted
      });

      const generateAbilityForUser = jest.fn().mockReturnValue({});

      await expect(
        authService.localSignIn(
          { email: 'NOPASSWORD@EXAMPLE.COM', password: 'password123' },
          generateAbilityForUser
        )
      ).rejects.toThrow('You need to first login when connected to internet to use your account offline.');
    });
  });

  describe('real world scenario: online then offline login', () => {
    it('should handle user signing in online with one case then offline with another', async () => {
      const generateAbilityForUser = jest.fn().mockReturnValue({});

      // Step 1: User signs in online (simulated by saveLocalUser)
      const onlineUserData = {
        email: 'John.Doe@Hospital.Com',
        displayName: 'John Doe',
      };

      const savedUser = await authService.saveLocalUser(onlineUserData, 'password123');
      expect(savedUser.email).toBe('John.Doe@Hospital.Com');

      // Wait for password hashing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Later, user tries to sign in offline with different case
      // Mock bcrypt compare for offline login
      jest.doMock('./bcrypt', () => ({
        compare: jest.fn().mockResolvedValue(true),
        hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
      }));

      // Reload user to get the hashed password
      const userWithPassword = await Database.models.User.getRepository().findOne({
        where: { id: savedUser.id }
      });
      userWithPassword.canAccessFacility = jest.fn().mockResolvedValue(true);

      // Update models to return the user with password
      const originalFindOne = authService.models.User.findOne;
      authService.models.User.findOne = jest.fn().mockResolvedValue(userWithPassword);

      const offlineResult = await authService.localSignIn(
        { email: 'john.doe@hospital.com', password: 'password123' },
        generateAbilityForUser
      );

      expect(offlineResult.id).toBe(savedUser.id);
      expect(offlineResult.email).toBe('John.Doe@Hospital.Com'); // Original case preserved

      // Restore original findOne method
      authService.models.User.findOne = originalFindOne;
    });
  });
});