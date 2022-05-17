jest.mock('react-native/Libraries/Utilities/DevSettings', () => ({
  addMenuItem: jest.fn(),
  reload: jest.fn(),
}));
