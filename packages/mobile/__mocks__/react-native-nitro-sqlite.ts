// Mock for react-native-nitro-sqlite
export const typeORMDriver = {
  openDatabase: jest.fn(),
  deleteDatabase: jest.fn(),
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  disablePromise: jest.fn(),
};

export const NitroSQLite = {
  native: {
    drop: jest.fn(),
  },
};

export default {
  typeORMDriver,
  NitroSQLite,
  ...typeORMDriver,
};
