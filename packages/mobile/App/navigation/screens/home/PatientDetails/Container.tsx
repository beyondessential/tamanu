import React, { useCallback, useState, ReactElement } from 'react';
import { Screen } from './Screen';
import { PatientDetails } from '/interfaces/PatientDetails';
import { PatientDetailsScreenProps } from '/interfaces/screens/PatientDetailsScreenProps';
import { Routes } from '/helpers/routes';

export const PatientDetailsScreen = ({
  navigation,
}: PatientDetailsScreenProps): ReactElement => {
  /**
   * Implement fetch patientDetails data
   * from a mock server (or real)
   */
  const patientData: PatientDetails = {
    id: 'TEMO001',
    generalInfo: {
      firstName: 'Ugyen',
      lastName: 'Wangdi',
      middleName: null,
      birthDate: new Date(),
      bloodType: 'A+',
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
    operativePlan: {
      data: [],
    },
  };

  const [reminders, setReminders] = useState(patientData.reminderWarnings);
  const [editField, setEditField] = useState(false);

  const changeReminder = useCallback((value: boolean) => {
    setReminders(value);
  }, []);

  const onNavigateToFilters = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientActions);
  }, []);

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const onEditField = useCallback(() => {
    setEditField(!editField);
  }, [editField]);

  return (
    <Screen
      patientData={patientData}
      onNavigateBack={onNavigateBack}
      onNavigateToFilters={onNavigateToFilters}
      onEditField={onEditField}
      reminders={reminders}
      changeReminder={changeReminder}
    />
  );
};
