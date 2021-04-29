import React, { useCallback, useState, ReactElement } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { compose } from 'redux';
import { useBackendEffect } from '~/ui/hooks';
import { Screen } from './Screen';
import { PatientDetails } from '~/ui/interfaces/PatientDetails';
import { PatientDetailsScreenProps } from '~/ui/interfaces/screens/PatientDetailsScreenProps';
import { Routes } from '~/ui/helpers/routes';
import { withPatient } from '~/ui/containers/Patient';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

const Container = ({
  navigation,
  selectedPatient,
}: PatientDetailsScreenProps): ReactElement => {
  const isFocused = useIsFocused(); // reload issues whenever the page is focused
  const [patientIssues, issuesError] = useBackendEffect(
    ({ models }) => {
      if (isFocused) {
        return models.PatientIssue.find({
          order: { recordedDate: 'ASC' },
          where: { patient: { id: selectedPatient.id } },
        });
      }
    },
    [isFocused, selectedPatient.id],
  );
  const [additionalData, additionalDataError] = useBackendEffect(
    ({ models }) => {
      if (isFocused) {
        return models.PatientAdditionalData.find({
          where: { patient: { id: selectedPatient.id } },
        });
      }
    },
    [isFocused, selectedPatient.id],
  );

  /**
   * Implement fetch patientDetails data
   * from a mock server (or real)
   */
  const patientData: PatientDetails = {
    id: selectedPatient.displayId,
    generalInfo: {
      ...selectedPatient,
      culturalTraditionName: null,
    },
    patientIssues,
    additionalData,
  };

  const [reminders, setReminders] = useState(patientData.reminderWarnings);
  const [editField, setEditField] = useState(false);

  const changeReminder = useCallback((value: boolean) => {
    setReminders(value);
  }, []);

  const onNavigateToFilters = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientActions);
  }, [navigation]);

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onEditField = useCallback(() => {
    setEditField(!editField);
  }, [editField]);

  const onEditPatientIssues = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddPatientIssue);
  }, [navigation]);

  if (issuesError) return <ErrorScreen error={issuesError} />;
  if (additionalDataError) return <ErrorScreen error={additionalDataError} />;
  if (!patientIssues || !additionalData) return <LoadingScreen />;

  return (
    <Screen
      patientData={patientData}
      onNavigateBack={onNavigateBack}
      onEditField={onEditField}
      onEditPatientIssues={onEditPatientIssues}
      reminders={reminders}
      changeReminder={changeReminder}
    />
  );
};

export const PatientDetailsScreen = compose(withPatient)(Container);
