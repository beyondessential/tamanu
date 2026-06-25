import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

interface VitalsTableRowHeaderProps {
  title: string;
  isOdd: boolean;
}

export const VitalsTableRowHeader = ({ title, isOdd }: VitalsTableRowHeaderProps): JSX.Element => (
  <View
    style={[
      styles.container,
      { backgroundColor: isOdd ? theme.colors.BACKGROUND_GREY : theme.colors.WHITE },
    ]}
  >
    <Text style={styles.text}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: screenPercentageToDP(31.63, Orientation.Width),
    borderRightWidth: 1,
    borderColor: theme.colors.BOX_OUTLINE,
    paddingLeft: screenPercentageToDP(3.64, Orientation.Width),
    height: screenPercentageToDP(6.46, Orientation.Height),
    justifyContent: 'center',
  },
  text: {
    fontSize: screenPercentageToDP(1.57, Orientation.Height),
    color: theme.colors.TEXT_DARK,
    fontWeight: '500',
  },
});
