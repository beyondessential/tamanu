import React, { ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export const Dot = (): ReactElement => (
  <StyledView
    background={theme.colors.TEXT_MID}
    height={5}
    width={5}
  />
);
