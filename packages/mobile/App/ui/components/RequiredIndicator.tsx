import React from 'react';

import { StyledText } from '/styled/common';
import { theme } from '~/ui/styled/theme';

interface RequiredIndicatorProps {
  marginLeft?: number;
}

export const RequiredIndicator = ({ marginLeft }: RequiredIndicatorProps): JSX.Element => (
  <StyledText marginLeft={marginLeft} color={theme.colors.ALERT}>*</StyledText>
);
