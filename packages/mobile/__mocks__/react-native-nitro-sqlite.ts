export const typeORMDriver = {
  openDatabase: jest.fn(),
  deleteDatabase: jest.fn(),
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  enableSimpleNullHandling: jest.fn(),
  disablePromise: jest.fn(),
};

export default {
  typeORMDriver,
  ...typeORMDriver,
}; 
