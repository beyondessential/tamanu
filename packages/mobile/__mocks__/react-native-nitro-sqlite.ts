const typeORMDriver = {
  openDatabase: jest.fn(),
  deleteDatabase: jest.fn(),
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  enableSimpleNullHandling: jest.fn(),
  disablePromise: jest.fn(),
};

jest.mock('react-native-nitro-sqlite', () => ({...typeORMDriver, typeORMDriver}));