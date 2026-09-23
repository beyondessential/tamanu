// Mock for react-native-quick-sqlite
export const typeORMDriver = {
  openDatabase: jest.fn(),
  deleteDatabase: jest.fn(),
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  disablePromise: jest.fn(),
};

export const QuickSQLite = {
  attach: jest.fn(),
  detach: jest.fn(),
  delete: jest.fn(),
};

export default {
  typeORMDriver,
  QuickSQLite,
  ...typeORMDriver,
};
