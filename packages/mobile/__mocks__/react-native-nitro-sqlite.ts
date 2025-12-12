jest.mock('react-native-nitro-sqlite', () => ({
  openDatabase: jest.fn(),
  deleteDatabase: jest.fn(),
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  enableSimpleNullHandling: jest.fn(),
  disablePromise: jest.fn(),
  typeORMDriver: {
    openDatabase: jest.fn(),
    deleteDatabase: jest.fn(),
    DEBUG: jest.fn(),
    enablePromise: jest.fn(),
    enableSimpleNullHandling: jest.fn(),
    disablePromise: jest.fn(),
  },
}));