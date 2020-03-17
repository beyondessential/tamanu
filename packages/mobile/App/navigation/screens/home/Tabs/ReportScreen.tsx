
import React, { ReactElement } from 'react';
import { StyledText, FullView, CenterView } from '../../../../styled/common';

export const ReportScreen = (): ReactElement => (
  <FullView>
    <CenterView flex={1}>
      <StyledText>Reports</StyledText>
    </CenterView>
  </FullView>
);
