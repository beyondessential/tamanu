import React, { memo } from 'react';
import { FullView, StyledText } from '~/ui/styled/common';
import { theme } from '/styled/theme';

interface Props {
  errorMessage: string;
}

export const PermissionErrorScreen: React.FC<Props> = memo(({ errorMessage }) => (
  <FullView>
    <StyledText fontWeight="bold">Forbidden:</StyledText>
    <StyledText paddingLeft="12px" color={theme.colors.ALERT}>
      {errorMessage}
    </StyledText>
  </FullView>
));
