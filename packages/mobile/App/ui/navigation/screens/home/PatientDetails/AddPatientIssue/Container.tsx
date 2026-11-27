import React, { type ReactElement, useCallback } from 'react';
import { formatISO9075 } from 'date-fns';
import type { NavigationProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '~/ui/hooks';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { type IPatientIssue, PatientIssueType } from '~/types';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { Screen } from './Screen';

export type AddPatientIssueProps = {
  navigation: NavigationProp<any>;
};

export const AddPatientIssueScreen = ({
  navigation,
}: AddPatientIssueProps): ReactElement<AddPatientIssueProps> => {
  const { selectedPatient } = useSelectedPatient();
  const { models } = useBackend();

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
      navigation.goBack();
    },
    [recordPatientIssue, navigation],
  );

  return (
    <Screen
      selectedPatient={selectedPatient}
      onNavigateBack={navigation.goBack}
      onRecordPatientIssue={onRecordPatientIssue}
    />
  );
};
