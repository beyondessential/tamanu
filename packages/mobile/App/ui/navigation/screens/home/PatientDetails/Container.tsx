import React, { useCallback, ReactElement } from 'react';

import { compose } from 'redux';
import { Screen } from './Screen';
import { PatientDetails } from '~/ui/interfaces/PatientDetails';
import { PatientDetailsScreenProps } from '~/ui/interfaces/screens/PatientDetailsScreenProps';
import { Routes } from '~/ui/helpers/routes';
import { withPatient } from '~/ui/containers/Patient';
import { joinNames } from '~/ui/helpers/user';

const Container = ({
  navigation,
  selectedPatient,
}: PatientDetailsScreenProps): ReactElement => {
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
  };

  // const [reminders, setReminders] = useState(patientData.reminderWarnings);
  // const [editField, setEditField] = useState(false);

  // const changeReminder = useCallback((value: boolean) => {
  //   setReminders(value);
  // }, []);

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // const onEditField = useCallback(() => {
  //   setEditField(!editField);
  // }, [editField]);

  const onEditPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.EditPatient, {
      patientName: joinNames(selectedPatient),
    });
  }, [navigation, selectedPatient]);

  const editPatientAdditionalData = useCallback((additionalData) => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.EditPatientAdditionalData, {
      patientId: selectedPatient.id,
      patientName: joinNames(selectedPatient),
      additionalDataJSON: JSON.stringify(additionalData),
    });
  }, [navigation, selectedPatient]);

  const onEditPatientIssues = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddPatientIssue);
  }, [navigation]);

  const onRecordDeath = useCallback(() => {
    navigation.navigate(Routes.HomeStack.DeceasedStack.Index);
  }, [navigation]);

  return (
    <Screen
      patient={selectedPatient}
      patientData={patientData}
      onNavigateBack={onNavigateBack}
      // onEditField={onEditField}
      onEditPatient={onEditPatient}
      editPatientAdditionalData={editPatientAdditionalData}
      onEditPatientIssues={onEditPatientIssues}
      // reminders={reminders}
      // changeReminder={changeReminder}
      onRecordDeath={onRecordDeath}
    />
  );
};

export const PatientDetailsScreen = compose(withPatient)(Container);
