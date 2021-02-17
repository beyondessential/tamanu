import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { NavigationProp } from '@react-navigation/native';

import { IPatient } from '~/types';
import { withPatient } from '~/ui/containers/Patient';

import { Screen, } from './Screen';

export type AddPatientIssueProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const Container = ({
  navigation,
  selectedPatient,
}: AddPatientIssueProps): ReactElement<AddPatientIssueProps> => {
  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onRecordPatientIssue = useCallback(async (fields: any) => {
    console.log('onRecordPatientIssue', selectedPatient.id, fields);
  }, [selectedPatient.id]);

  return (
    <Screen
      selectedPatient={selectedPatient}
      onNavigateBack={onNavigateBack}
      onRecordPatientIssue={onRecordPatientIssue}
    />
  );
};

export const AddPatientIssueScreen = compose(withPatient)(Container);
