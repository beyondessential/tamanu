jest.mock('react-native/Libraries/Utilities/DevSettings', () => ({
  __esModule: true,
  default: {
    addMenuItem: jest.fn(),
    reload: jest.fn(),
    onFastRefresh: jest.fn(),
  },
}));
