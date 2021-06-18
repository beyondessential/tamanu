import React, { ReactElement } from 'react';
import { compose } from 'redux';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { LabRequestTable } from '/components/LabRequestTable';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';
import { Text } from 'react-native';

export const DumbViewHistoryScreen = ({ selectedPatient }): ReactElement => {
  const [data, error] = useBackendEffect(
    ({ models }) => models.LabRequest.getForPatient(selectedPatient.id),
    [],
  );

  if (error) return <ErrorScreen error={error} />;

  return (
    <StyledSafeAreaView flex={1}>
      <FullView>
        {/* {data ? <LabRequestTable patientData={data} /> : <LoadingScreen />} */}
        <Text>{JSON.stringify(data)}</Text>
      </FullView>
    </StyledSafeAreaView>
  );
};

export const ViewHistoryScreen = compose(withPatient)(DumbViewHistoryScreen);
