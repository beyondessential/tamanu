import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { ReactElement } from 'react';

export const Dot = (): ReactElement => (
  <StyledView background={theme.colors.TEXT_MID} height={5} width={5} />
);
