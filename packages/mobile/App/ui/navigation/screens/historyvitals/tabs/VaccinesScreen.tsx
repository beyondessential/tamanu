import React, { ReactElement } from 'react';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';

export const VaccinesScreen = (): ReactElement => {
  return (
    <StyledSafeAreaView flex={1}>
      <FullView background={theme.colors.BACKGROUND_GREY} />
    </StyledSafeAreaView>
  );
};
