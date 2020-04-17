import React, { ReactElement } from 'react';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { VitalsTable } from '/components/VitalsTable';
import { patientHistoryList } from '/components/VitalsTable/fixtures';

export const VitalsScreen = (): ReactElement => {
  return (
    <StyledSafeAreaView flex={1}>
      <FullView background={theme.colors.BACKGROUND_GREY}>
        <VitalsTable patientData={patientHistoryList} />
      </FullView>
    </StyledSafeAreaView>
  );
};
