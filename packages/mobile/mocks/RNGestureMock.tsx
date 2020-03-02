import { TouchableWithoutFeedback, ScrollView } from 'react-native';
jest.mock('react-native-gesture-handler', () => ({
  ScrollView: ScrollView,
  TouchableWithoutFeedback: TouchableWithoutFeedback,
  Direction: {},
}));
