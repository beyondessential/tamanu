

import React, { ReactElement } from 'react';
import { StyledText, FullView, CenterView } from '../../../../styled/common';

export const SyncDataScreen = (): ReactElement => (
  <FullView>
    <CenterView flex={1}>
      <StyledText>Data Sync</StyledText>
    </CenterView>
  </FullView>
);
