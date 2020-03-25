

import React, { ReactElement } from 'react';
import { StyledText, FullView, CenterView } from '/styled/common';

export const MoreScreen = (): ReactElement => (
  <FullView>
    <CenterView flex={1}>
      <StyledText>More</StyledText>
    </CenterView>
  </FullView>
);
