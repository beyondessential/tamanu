import React, { useState, memo } from 'react';
import { FullView, CenterView, StyledText } from '~/ui/styled/common';
import { CircularProgress } from '~/ui/components/CircularProgress';

export const LoadingScreen = memo(({ progress = 100 }) => (
  <FullView>
    <CenterView>
      <CircularProgress progress={progress} />
    </CenterView>
  </FullView>
));
