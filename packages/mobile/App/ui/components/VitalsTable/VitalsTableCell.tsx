import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ISurveyResponseAnswer, ValidationCriteria } from '~/types';

interface VitalsTableCellProps {
  data?: ISurveyResponseAnswer;
  validationCriteria: ValidationCriteria
}

const checkNeedsAttention = (
  value: string,
  validationCriteria: ValidationCriteria = {},
) : boolean => {
  const { normalRange } = validationCriteria;
  const fValue = parseFloat(value);
  if (!normalRange || Number.isNaN(fValue)) return false;
  return fValue > normalRange.max || fValue < normalRange.min;
};

export const VitalsTableCell = ({
  data,
  validationCriteria = {},
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
        {cellValue}{checkNeedsAttention(cellValue, validationCriteria)
        && <StyledText color={theme.colors.ALERT}>*</StyledText>}
      </StyledText>
    </StyledView>
  );
};
