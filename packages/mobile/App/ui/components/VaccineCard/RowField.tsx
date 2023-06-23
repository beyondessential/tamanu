import React, { FC } from 'react';
import { StyleSheet } from 'react-native';

import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

type RowFieldProps = {
  label: string;
  value: string;
};

const styles = StyleSheet.create({
  row: {
    minHeight: 50,
    maxWidth: '100%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexGrow: 1,
    alignItems: 'center',
    marginLeft: 15,
    marginRight: 15,
    borderBottomWidth: 1,
    borderColor: theme.colors.BOX_OUTLINE,
  },
  labelText: {
    fontSize: 15,
    color: theme.colors.TEXT_MID,
  },
  valueText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.TEXT_DARK,
  },
});

export const RowField: FC<RowFieldProps> = ({ label, value }: RowFieldProps) => (
  <StyledView marginLeft={screenPercentageToDP(48, Orientation.Width)} style={styles.row}>
    <StyledView
      marginLeft={screenPercentageToDP(2, Orientation.Width)}
      width={screenPercentageToDP(48, Orientation.Width)}
    >
      <StyledText style={styles.labelText}>{label}</StyledText>
    </StyledView>
    <StyledView width={screenPercentageToDP(42, Orientation.Width)}>
      <StyledText style={styles.valueText}>{value || '-'}</StyledText>
    </StyledView>
  </StyledView>
);
