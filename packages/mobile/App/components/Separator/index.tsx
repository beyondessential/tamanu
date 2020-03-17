import React, { ReactElement } from 'react';

import { StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';

interface SeparatorProps {
  width: number | string;
}

export const Separator = ({ width = '100%' }: SeparatorProps): ReactElement => (
  <StyledView
    alignSelf="center"
    height={1}
    background={theme.colors.DEFAULT_OFF}
    width={width}
  />
);
