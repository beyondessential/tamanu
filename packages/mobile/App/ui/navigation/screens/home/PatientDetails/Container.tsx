import React, { useCallback, useState, ReactElement } from 'react';
import { useBackendEffect } from '~/ui/hooks';
import { Screen } from './Screen';
import { PatientDetails } from '~/ui/interfaces/PatientDetails';
import { PatientDetailsScreenProps } from '~/ui/interfaces/screens/PatientDetailsScreenProps';
import { Routes } from '~/ui/helpers/routes';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

const Container = ({
  navigation,
  selectedPatient,
}: PatientDetailsScreenProps): ReactElement => {
  const [patientIssues, error] = useBackendEffect(
    ({ models }) => models.PatientIssue.find({
      order: { recordedDate: 'ASC' },
      where: { patient: { id: selectedPatient.id } },
    }),
    [],
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
    reminderWarnings: true,
    parentsInfo: {
      fatherName: 'Nuno Wangdi',
      motherName: 'Rose Wangdi',
    },
    ongoingConditions: {
      data: ['Hepatitis C', 'Asthma'],
    },
    familyHistory: {
      data: ['Haemochromatosis'],
    },
    patientIssues,
    allergies: {
      data: ['rhinitis'],
    },
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

  if (error) return <ErrorScreen error={error} />;
  if (!patientIssues) return <LoadingScreen />;

  return (
    <Screen
      patientData={patientData}
      onNavigateBack={onNavigateBack}
      onNavigateToFilters={onNavigateToFilters}
      onEditField={onEditField}
      onEditPatientIssues={onEditPatientIssues}
      reminders={reminders}
      changeReminder={changeReminder}
    />
  );
};

export const PatientDetailsScreen = compose(withPatient)(Container);
