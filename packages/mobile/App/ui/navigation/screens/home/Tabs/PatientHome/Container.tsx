import React, { ReactElement, useMemo, useCallback } from 'react';
import { compose } from 'redux';
// Components
import * as Icons from '/components/Icons';
import { PatientHomeScreenProps } from '../../../../../interfaces/screens/HomeStack';
import { Screen } from './Screen';
// Helpers
import { Routes } from '/helpers/routes';
// Containers
import { withPatient } from '/containers/Patient';

const PatientHomeContainer = ({
  navigation,
  selectedPatient,
}: PatientHomeScreenProps): ReactElement => {
  const visitTypeButtons = useMemo(
    () => [
      {
        title: 'Sick \n or Injured',
        Icon: Icons.SickOrInjured,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.SickOrInjuredTabs.name),
      },
      {
        title: 'Check up',
        Icon: Icons.CheckUp,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.CheckUpStack.name),
      },
      {
        title: 'Programs',
        Icon: Icons.Pregnancy,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.ProgramStack.name),
      },
      {
        title: 'Referral',
        Icon: Icons.FamilyPlanning,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.ReferralTabs.name),
      },
      {
        title: 'Vaccine',
        Icon: Icons.Vaccine,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.VaccineStack.name),
      },
      {
        title: 'Deceased',
        Icon: Icons.Deceased,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.DeceasedStack.name),
      },
    ],
    [],
  );

  const patientMenuButtons = useMemo(
    () => [
      {
        title: 'View patients details',
        Icon: Icons.History,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.PatientDetails),
      },
      {
        title: 'View History',
        Icon: Icons.Appointments,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.HistoryVitalsStack.name),
      },
    ],
    [],
  );

  const onNavigateToSearchPatients = useCallback(() => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.name);
  }, []);

  const onNavigateToPatientActions = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientActions);
  }, []);

  return (
    <Screen
      selectedPatient={selectedPatient}
      navigateToSearchPatients={onNavigateToSearchPatients}
      visitTypeButtons={visitTypeButtons}
      patientMenuButtons={patientMenuButtons}
      navigateToPatientActions={onNavigateToPatientActions}
    />
  );
};
export const PatientHome = compose(withPatient)(PatientHomeContainer);
