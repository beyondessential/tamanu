import React, { ReactElement } from 'react';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { VitalsTable } from '/components/VitalsTable';
import { patientHistoryList } from '/components/VitalsTable/fixtures';

export const CheckViewHistoryScreen = (): ReactElement => {
  return (
    <StyledSafeAreaView flex={1}>
      <FullView>
        <VitalsTable patientData={patientHistoryList} />
      </FullView>
    </StyledSafeAreaView>
  );
};
