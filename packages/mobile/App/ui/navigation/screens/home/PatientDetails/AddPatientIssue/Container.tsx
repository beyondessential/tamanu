import React, { ReactElement, useCallback } from 'react';
import { formatISO9075 } from 'date-fns';
import { compose } from 'redux';
import { NavigationProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '~/ui/hooks';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { IPatient, IPatientIssue, PatientIssueType } from '~/types';
import { withPatient } from '~/ui/containers/Patient';
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
    navigation.goBack();
  }, [navigation]);

  const queryClient = useQueryClient();
  const { mutateAsync: recordPatientIssue } = useMutation({
    mutationFn: ({ note }: Partial<IPatientIssue>) =>
      models.PatientIssue.createAndSaveOne({
        note,
        recordedDate: formatISO9075(new Date()),
        type: PatientIssueType.Issue,
        patient: selectedPatient.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.issues(selectedPatient.id) });
    },
  });

  const onRecordPatientIssue = useCallback(
    async (values: Partial<IPatientIssue>) => {
      await recordPatientIssue(values);
      navigateToDetails();
    },
    [recordPatientIssue, navigateToDetails],
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
