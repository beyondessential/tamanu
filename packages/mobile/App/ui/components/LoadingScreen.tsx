import React, { memo } from 'react';
import { FullView, CenterView } from '~/ui/styled/common';
import { CircularProgress } from '~/ui/components/CircularProgress';

interface Props {
  progress?: number;
  text?: string;
}

export const LoadingScreen: React.FC<Props> = memo(({ progress = 100 }) => (
  <FullView padding={12} justifyContent="center" alignItems="center">
    <CenterView>
      <CircularProgress progress={progress} />
    </CenterView>
  </FullView>
));
