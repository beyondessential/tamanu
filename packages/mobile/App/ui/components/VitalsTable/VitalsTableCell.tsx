import React from 'react';
import { StyledText, StyledView } from '/styled/common';
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
    if (config?.rounding) {
      cellValue = parseFloat(cellValue).toFixed(config.rounding);
    }
  }
  return (
    <StyledView
      height={screenPercentageToDP(6.46, Orientation.Height)}
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
      background={isOdd ? theme.colors.BACKGROUND_GREY : theme.colors.WHITE}
    >
      <StyledText
        fontSize={screenPercentageToDP(1.57, Orientation.Height)}
        fontWeight={500}
        color={theme.colors.TEXT_SUPER_DARK}
      >
        {cellValue}
      </StyledText>
      {needsAttention && (
        <RequiredIndicator
          marginLeft={screenPercentageToDP(0.4, Orientation.Width)}
        />
      )}
    </StyledView>
  );
};
