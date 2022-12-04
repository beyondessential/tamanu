import React, { ReactElement } from 'react';
import { compose } from 'redux';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { VitalsTable } from '/components/VitalsTable';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';
import { useSelector } from 'react-redux';
import { ReduxStoreProps } from '/interfaces/ReduxStoreProps';
import { PatientStateProps } from '/store/ducks/patient';

export const ViewHistoryScreen = (): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  console.log('selectedPatient', selectedPatient);

  // Note: Vitals are only filtered by patient instead of encounter on mobile
  const [data, error] = useBackendEffect(
    ({ models }) => models.Patient.getVitals(selectedPatient.id),
    [],
  );

  if (error) return <ErrorScreen error={error} />;

  console.log('error', error);
  console.log('data', data);

  return (
    <StyledSafeAreaView flex={1}>
      {/*<FullView>{data ? <VitalsTable patientData={data} /> : <LoadingScreen />}</FullView>*/}
    </StyledSafeAreaView>
  );
};

export const DumbViewHistoryScreen = ({ selectedPatient }): ReactElement => {
  const [data, error] = useBackendEffect(
    ({ models }) => models.Vitals.getForPatient(selectedPatient.id),
    [],
  );

  if (error) return <ErrorScreen error={error} />;

  return (
    <StyledSafeAreaView flex={1}>
      <FullView>{data ? <VitalsTable patientData={data} /> : <LoadingScreen />}</FullView>
    </StyledSafeAreaView>
  );
};

export const LegacyViewHistoryScreen = compose(withPatient)(DumbViewHistoryScreen);
