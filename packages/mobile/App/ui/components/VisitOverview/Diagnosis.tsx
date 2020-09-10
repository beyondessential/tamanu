import React from 'react';
import { ColumnView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';

export const Diagnosis = ({ info }: { info: string }): Element => (
  <ColumnView>
    <StyledText fontSize={14} fontWeight={500} marginBottom="5px">
      Diagnosis
    </StyledText>
    <StyledText fontSize={16} color={theme.colors.TEXT_MID}>
      {info}
    </StyledText>
  </ColumnView>
);
