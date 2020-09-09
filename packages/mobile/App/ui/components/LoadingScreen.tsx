import React, { memo } from 'react';
import { FullView, CenterView } from '~/ui/styled/common';
import { CircularProgress } from '~/ui/components/CircularProgress';

interface Props {
  progress?: number;
}

export const LoadingScreen: React.FC<Props> = memo(({ progress = 100 }) => (
  <FullView>
    <CenterView>
      <CircularProgress progress={progress} />
    </CenterView>
  </FullView>
));
