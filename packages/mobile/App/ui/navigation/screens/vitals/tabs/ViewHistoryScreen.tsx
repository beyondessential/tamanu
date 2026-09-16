import React, { type ReactElement } from 'react';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { VitalsTable } from '/components/VitalsTable';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { useSelector } from 'react-redux';
import type { ReduxStoreProps } from '/interfaces/ReduxStoreProps';
import type { PatientStateProps } from '/store/ducks/patient';

export const ViewHistoryScreen = (): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  // Note: Vitals are only filtered by patient instead of encounter on mobile
  const { data: response, error } = useQuery({
    queryKey: patientKeys.vitals(selectedPatient.id),
    queryFn: () => Database.models.Patient.getVitals(selectedPatient.id),
  });

  if (error) return <ErrorScreen error={error} />;

  return (
    <StyledSafeAreaView flex={1}>
      <FullView>
        {response?.data ? (
          <VitalsTable data={response.data} columns={response.columns} />
        ) : (
          <LoadingScreen />
        )}
      </FullView>
    </StyledSafeAreaView>
  );
};
