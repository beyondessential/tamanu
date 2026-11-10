import React from 'react';

import { theme } from '~/ui/styled/theme';
import { StyledText } from '/styled/common';

interface RequiredIndicatorProps {
  marginLeft?: number;
}

export const RequiredIndicator = ({ marginLeft }: RequiredIndicatorProps) => (
  <StyledText marginLeft={marginLeft} color={theme.colors.ALERT}>
    {' '}
    *
  </StyledText>
);
