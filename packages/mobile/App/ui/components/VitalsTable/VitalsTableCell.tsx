import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ISurveyResponseAnswer } from '~/types';

interface VitalsTableCellProps {
  data?: ISurveyResponseAnswer;
  needsAttention: boolean,
}

export const VitalsTableCell = ({
  data,
  needsAttention,
}: VitalsTableCellProps) : JSX.Element => {
  const cellValue = data?.body || '';
  return (
    <StyledView
      width="100%"
      height={screenPercentageToDP(5.46, Orientation.Height)}
      justifyContent="center"
      borderBottomWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      borderRightWidth={1}
    >
      <StyledText
        fontSize={screenPercentageToDP(1.57, Orientation.Height)}
        color={theme.colors.TEXT_DARK}
        textAlign="center"
      >
        {cellValue}{needsAttention
        && <StyledText color={theme.colors.ALERT}>*</StyledText>}
      </StyledText>
    </StyledView>
  );
};
