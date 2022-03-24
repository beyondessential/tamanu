import React from 'react';
import { ColumnView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';

export const TreatmentPlan = ({
  treatment,
}: {
  treatment: string;
}): JSX.Element => (
    <ColumnView marginTop={20}>
      <StyledText fontSize={14} fontWeight={500} marginBottom="5px">
        Treatment plan
    </StyledText>
      <StyledText fontSize={16} color={theme.colors.TEXT_MID}>
        {treatment}
      </StyledText>
    </ColumnView>
  );
