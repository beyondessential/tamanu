import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, GestureResponderEvent } from 'react-native';
import { theme } from '/styled/theme';

const styles = StyleSheet.create({
  View: {
    position: 'absolute',
    top: 20,
  },
  Image: {
    width: 120,
    height: 80,
  },
  Text: {
    color: theme.colors.ALERT,
    textDecorationColor: theme.colors.ALERT,
    textDecorationLine: 'underline',
  },
});

interface BypassWarningIconProps {
  onBypassWarning: (event: GestureResponderEvent) => void
}

export const BypassWarningIcon = ({ onBypassWarning }: BypassWarningIconProps): JSX.Element => (
  <View style={styles.View}>
    <Image
      source={require('../../assets/Warning.png')}
      resizeMode="contain"
      style={styles.Image}
    />
    <TouchableOpacity onPress={onBypassWarning}>
      <Text style={styles.Text}>Administer anyway</Text>
    </TouchableOpacity>
  </View>
);
