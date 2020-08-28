import React, { useState, memo } from 'react';
import { FullView, StyledText, StyledView } from '~/ui/styled/common';

export const ErrorScreen = memo(({ error }) => (
  <FullView>
    <StyledText>Error:</StyledText>
    <StyledText>{ error.message }</StyledText>
    <StyledText>Details:</StyledText>
    <StyledText>{ JSON.stringify(error, null, 2) }</StyledText>
  </FullView>
));
