import React, { ReactElement, useMemo, useCallback } from 'react';
import { compose } from 'redux';
import { setStatusBar } from '/helpers/screen';
// Components
import * as Icons from '/components/Icons';
import { PatientHomeScreenProps } from '/interfaces/screens/HomeStack';
import { Screen } from './Screen';
// Helpers
import { Routes } from '/helpers/routes';
import { theme } from '/styled/theme';
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
        Icon: Icons.SickOrInjuredIcon,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.SickOrInjuredTabs.name),
      },
      {
        title: 'Check up',
        Icon: Icons.CheckUpIcon,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.CheckUpStack.name),
      },
      {
        title: 'Programs',
        Icon: Icons.PregnancyIcon,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.ProgramStack.name),
      },
      {
        title: 'Referral',
        Icon: Icons.FamilyPlanningIcon,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.ReferralTabs.name),
      },
      {
        title: 'Vaccine',
        Icon: Icons.VaccineIcon,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.VaccineStack.name),
      },
      {
        title: 'Deceased',
        Icon: Icons.DeceasedIcon,
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
        Icon: Icons.PatientDetailsIcon,
        onPress: (): void =>
          navigation.navigate(Routes.HomeStack.PatientDetails),
      },
      {
        title: 'View History',
        Icon: Icons.HistoryIcon,
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

  setStatusBar('light-content', theme.colors.PRIMARY_MAIN);

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
