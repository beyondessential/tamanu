import React, { useCallback, useState, ReactElement } from 'react';
import { Screen } from './Screen';
import { PatientDetails } from '../../../../interfaces/PatientDetails';


export const PatientDetailsScreen = (): ReactElement => {
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

  const changeReminder = useCallback(
    (value: boolean) => {
      setReminders(value);
    },
    [],
  );

  const onNavigateToFilters = useCallback(
    () => {
      console.log('navigate to filters...');
    },
    [],
  );

  const onNavigateBack = useCallback(
    () => {
      console.log('navigate back...');
    },
    [],
  );

  const onEditField = useCallback(
    () => {
      setEditField(!editField);
    },
    [editField],
  );

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
