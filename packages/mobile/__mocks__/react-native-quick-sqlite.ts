// Mock for react-native-quick-sqlite
export const typeORMDriver = {
  openDatabase: jest.fn(),
  deleteDatabase: jest.fn(),
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  disablePromise: jest.fn(),
};

export default {
  typeORMDriver,
  ...typeORMDriver,
}; 
