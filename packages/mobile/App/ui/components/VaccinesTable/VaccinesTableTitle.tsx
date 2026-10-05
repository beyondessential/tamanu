import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '/styled/theme';

export const VaccinesTableTitle = memo(() => (
  <View style={styles.container}>
    <Text style={styles.text}>Vaccine</Text>
  </View>
));

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.MAIN_SUPER_DARK,
    width: 130,
    height: 60,
    justifyContent: 'center',
    paddingLeft: 15,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.WHITE,
  },
});
