import React, { useState, memo } from 'react';
import { FullView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '/styled/theme';

export const ErrorScreen = memo(({ error }) => (
  <FullView>
    <StyledText fontWeight="bold">Error:</StyledText>
    <StyledText paddingLeft="12px" color={theme.colors.ALERT}>
      {error.message}
    </StyledText>

    <StyledText fontWeight="bold">Details:</StyledText>
    <StyledText paddingLeft="12px">{JSON.stringify(error, null, 2)}</StyledText>
  </FullView>
));
