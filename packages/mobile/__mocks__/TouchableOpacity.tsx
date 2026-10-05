jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => ({
  __esModule: true,
  default: 'TouchableOpacity',
}));

jest.mock('react-native/Libraries/Components/Touchable/TouchableHighlight', () => ({
  __esModule: true,
  default: 'TouchableHighlight',
}));
