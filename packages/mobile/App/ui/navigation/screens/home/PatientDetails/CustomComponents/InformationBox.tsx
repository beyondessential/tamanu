import React, { ReactElement, ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';

interface InformationBoxProps {
  title: ReactNode;
  info: ReactNode;
  style?: ViewStyle;
}

export const InformationBox = ({ title, info, style }: InformationBoxProps): ReactElement => (
  <View style={[styles.container, style]}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.info}>{info}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: screenPercentageToDP(1.7, Orientation.Height),
    fontWeight: '500',
    color: theme.colors.TEXT_DARK,
  },
  info: {
    marginTop: 5,
    fontSize: screenPercentageToDP(1.94, Orientation.Height),
    color: theme.colors.TEXT_MID,
  },
});
