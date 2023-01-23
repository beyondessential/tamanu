import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ISurveyResponseAnswer } from '~/types';

interface VitalsTableCellProps {
  data?: ISurveyResponseAnswer;
  needsAttention: boolean;
  isOdd: boolean;
}

export const VitalsTableCell = ({
  data,
  needsAttention,
  isOdd,
}: VitalsTableCellProps) : JSX.Element => {
  const cellValue = data?.body || '';
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
        <StyledText
          marginLeft={screenPercentageToDP(0.4, Orientation.Width)}
          color={theme.colors.ALERT}>
          *
        </StyledText>
      )}
    </StyledView>
  );
};
