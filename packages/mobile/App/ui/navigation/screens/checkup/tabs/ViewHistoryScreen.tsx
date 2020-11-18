import React, { ReactElement } from 'react';
import { compose } from 'redux';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { VitalsTable } from '/components/VitalsTable';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';

export const DumbViewHistoryScreen = ({ selectedPatient }): ReactElement => {
  const [data, error] = useBackendEffect(
    ({ models }) => models.Vitals.getForPatient(selectedPatient.id),
    [],
  );

  if (error) return <ErrorScreen error={error} />;

  return (
    <StyledSafeAreaView flex={1}>
      <FullView>
        {data ? <VitalsTable patientData={data} /> : <LoadingScreen />}
      </FullView>
    </StyledSafeAreaView>
  );
};

export const ViewHistoryScreen = compose(withPatient)(DumbViewHistoryScreen);
