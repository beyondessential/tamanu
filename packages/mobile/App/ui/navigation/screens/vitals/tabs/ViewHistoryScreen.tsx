import { VitalsTable } from '/components/VitalsTable';
import { ReduxStoreProps } from '/interfaces/ReduxStoreProps';
import { PatientStateProps } from '/store/ducks/patient';
import { FullView, StyledSafeAreaView } from '/styled/common';
import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { useBackendEffect } from '~/ui/hooks';

export const ViewHistoryScreen = (): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  // Note: Vitals are only filtered by patient instead of encounter on mobile
  const [response, error] = useBackendEffect(
    ({ models }) => models.Patient.getVitals(selectedPatient.id),
    [selectedPatient.id],
  );

  if (error) return <ErrorScreen error={error} />;

  return (
    <StyledSafeAreaView flex={1}>
      <FullView>
        {response?.data ?
          <VitalsTable data={response.data} columns={response.columns} /> :
          <LoadingScreen />}
      </FullView>
    </StyledSafeAreaView>
  );
};
