import React, { useState, memo } from 'react';
import { 
  FullView, 
  CenterView, 
  StyledText,
  StyledView,
} from '~/ui/styled/common';
import { CircularProgress } from '~/ui/components/CircularProgress';

export const LoadingScreen = memo(({ text }) => (
  <FullView>
    <CenterView>
      <CircularProgress progress={100} />
      <StyledText>{ text }</StyledText>
    </CenterView>
  </FullView>
));
