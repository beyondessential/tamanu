import React from 'react';
import { isNumber } from 'lodash-es';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { ISurveyResponseAnswer, SurveyScreenConfig } from '~/types';
import { RequiredIndicator } from '../RequiredIndicator';

interface VitalsTableCellProps {
  data?: ISurveyResponseAnswer;
  config?: SurveyScreenConfig;
  needsAttention: boolean;
  isOdd: boolean;
}

export const VitalsTableCell = ({
  data,
  config,
  needsAttention,
  isOdd,
}: VitalsTableCellProps): JSX.Element => {
  let cellValue = '';
  if (data?.body) {
    cellValue = data?.body;
    if (isNumber(config?.rounding)) {
      cellValue = parseFloat(cellValue).toFixed(config.rounding);
    }
  }
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isOdd ? theme.colors.BACKGROUND_GREY : theme.colors.WHITE },
      ]}
    >
      <Text style={styles.text}>{cellValue}</Text>
      {needsAttention && (
        <RequiredIndicator marginLeft={screenPercentageToDP(0.4, Orientation.Width)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: screenPercentageToDP(6.46, Orientation.Height),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: screenPercentageToDP(1.57, Orientation.Height),
    fontWeight: '500',
    color: theme.colors.TEXT_SUPER_DARK,
  },
});
