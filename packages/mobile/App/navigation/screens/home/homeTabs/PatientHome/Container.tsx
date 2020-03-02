import React, { ReactElement, useMemo, useCallback } from 'react';
import { compose } from 'redux';
// Components
import * as Icons from '../../../../../components/Icons';
import { PatientHomeScreenProps } from '../../../../../interfaces/screens/HomeStack';
import { Screen } from './Screen';
// Helpers
import { Routes } from '../../../../../helpers/constants';
// Containers
import { withPatient } from '../../../../../containers/Patient';

const PatientHomeContainer = ({ navigation }: PatientHomeScreenProps): ReactElement => {
  const visitTypeButtons = useMemo(() => [
    {
      title: 'Sick \n or Injured',
      Icon: Icons.SickOrInjured,
      onPress: (): void => console.log('here'),
    },
    {
      title: 'Check up',
      Icon: Icons.CheckUp,
      onPress: (): void => console.log('here'),
    },
    {
      title: 'Programs',
      Icon: Icons.Pregnancy,
      onPress: (): void => console.log('here'),
    },
    {
      title: 'Referral',
      Icon: Icons.FamilyPlanning,
      onPress: (): void => console.log('here'),
    },
    {
      title: 'Vaccine',
      Icon: Icons.Vaccine,
      onPress: (): void => console.log('here'),
    },
    {
      title: 'Deceased',
      Icon: Icons.Deceased,
      onPress: (): void => console.log('here'),
    },
  ], []);

  const patientMenuButtons = useMemo(() => [
    {
      title: 'View patients details',
      Icon: Icons.History,
      onPress: (): void => console.log('Patient details'),
    },
    {
      title: 'View History',
      Icon: Icons.Appointments,
      onPress: (): void => console.log('History'),
    },
  ], []);

  const onNavigateToSearchPatients = useCallback(
    () => {
      navigation.navigate(Routes.HomeStack.SearchPatientStack.name);
    },
    [],
  );

  const onNavigateToPatientActions = useCallback(
    () => {
      navigation.navigate('patient-actions');
    },
    [],
  );

  return (
    <Screen
      navigateToSearchPatients={onNavigateToSearchPatients}
      visitTypeButtons={visitTypeButtons}
      patientMenuButtons={patientMenuButtons}
      navigateToPatientActions={onNavigateToPatientActions}
    />
  );
};
export const PatientHome = compose(withPatient)(PatientHomeContainer);
