import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TranslatedText } from '/components/Translations/TranslatedText';

export const VitalsTableTitle = (): JSX.Element => (
  <View style={styles.container}>
    <Text style={styles.text}>
      <TranslatedText stringId="vitals.table.column.measure" fallback="Measure" />
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.WHITE,
    width: screenPercentageToDP(31.63, Orientation.Width),
    height: screenPercentageToDP(6.86, Orientation.Height),
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.BOX_OUTLINE,
    justifyContent: 'center',
    paddingLeft: screenPercentageToDP(3.64, Orientation.Width),
  },
  text: {
    fontSize: screenPercentageToDP(1.6, Orientation.Height),
    fontWeight: '500',
    color: '#326699',
  },
});
