import React from 'react';

import { theme } from '~/ui/styled/theme';
import { StyledText } from '/styled/common';

export const RequiredIndicator = (): JSX.Element => (
  <StyledText color={theme.colors.ALERT}> *</StyledText>
);
