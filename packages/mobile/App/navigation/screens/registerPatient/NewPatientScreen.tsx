import React, { ReactElement } from 'react';
import { CenterView, StyledText } from '/styled/common';
import { theme } from '/root/App/styled/theme';

const NewPatientScreen = (): ReactElement => {
  return (
    <CenterView flex={1} background={theme.colors.BACKGROUND_GREY}>
      <StyledText>New Patient Success Screen</StyledText>
    </CenterView>
  );
};

export default NewPatientScreen;
