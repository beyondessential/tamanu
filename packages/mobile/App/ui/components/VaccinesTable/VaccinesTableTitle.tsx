import React, { memo } from 'react';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export const VaccinesTableTitle = memo(() => (
  <StyledView
    background={theme.colors.MAIN_SUPER_DARK}
    width={130}
    height={60}
    justifyContent="center"
    paddingLeft={15}
  >
    <StyledText fontSize={12} fontWeight={700} color={theme.colors.WHITE}>
      Vaccine
    </StyledText>
  </StyledView>
));
