import React, { ReactElement, useCallback } from 'react';
import { formatISO9075 } from 'date-fns';
import { compose } from 'redux';
import { NavigationProp } from '@react-navigation/native';
import { useBackend } from '~/ui/hooks';
import { IPatient, IPatientIssue, PatientIssueType } from '~/types';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';

import { Screen } from './Screen';

export type AddPatientIssueProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const Container = ({
  navigation,
  selectedPatient,
}: AddPatientIssueProps): ReactElement<AddPatientIssueProps> => {
  const { models } = useBackend();

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const navigateToDetails = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
  }, [navigation]);

  const onRecordPatientIssue = useCallback(
    async ({ note }: Partial<IPatientIssue>) => {
      await models.PatientIssue.createAndSaveOne({
        note,
        recordedDate: formatISO9075(new Date()),
        type: PatientIssueType.Issue,
        patient: selectedPatient.id,
      });
      navigateToDetails();
    },
    [selectedPatient.id, navigation],
  );

  return (
    <Screen
      selectedPatient={selectedPatient}
      onNavigateBack={onNavigateBack}
      onRecordPatientIssue={onRecordPatientIssue}
    />
  );
};

export const AddPatientIssueScreen = compose(withPatient)(Container);
