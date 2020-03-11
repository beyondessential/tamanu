import React from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';

jest.mock('react-native-gesture-handler', () => ({
  ScrollView: View,
  Orientation: {},
  TouchableWithoutFeedback: TouchableWithoutFeedback,
}));
