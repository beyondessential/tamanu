import React, { ReactElement, useMemo, useCallback, useState } from 'react';
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
import { useBackend } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';

const PatientHomeContainer = ({
  navigation,
  selectedPatient,
}: PatientHomeScreenProps): ReactElement => {
  const [errorMessage, setErrorMessage] = useState();
  const visitTypeButtons = useMemo(
    () => [
      {
        title: 'Sick \n or Injured',
        Icon: Icons.SickOrInjuredIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.SickOrInjuredTabs.Index),
      },
      {
        title: 'Check up',
        Icon: Icons.CheckUpIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.CheckUpStack.Index),
      },
      {
        title: 'Programs',
        Icon: Icons.PregnancyIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.ProgramStack.Index),
      },
      {
        title: 'Referral',
        Icon: Icons.FamilyPlanningIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.ReferralTabs.Index),
      },
      {
        title: 'Vaccine',
        Icon: Icons.VaccineIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.VaccineStack.Index),
      },
      {
        title: 'Deceased',
        Icon: Icons.DeceasedIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.DeceasedStack.Index),
      },
    ],
    [],
  );

  const patientMenuButtons = useMemo(
    () => [
      {
        title: 'View patients details',
        Icon: Icons.PatientDetailsIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index),
      },
      {
        title: 'View History',
        Icon: Icons.HistoryIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.HistoryVitalsStack.Index),
      },
    ],
    [],
  );

  const onNavigateToSearchPatients = useCallback(() => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.Index);
  }, []);

  const onNavigateToPatientActions = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientActions);
  }, []);

  const { models, syncManager } = useBackend();
  const onSyncPatient = useCallback(
    async (): Promise<void> => {
      try {
        await models.Patient.markForSync(selectedPatient.id);
        syncManager.runScheduledSync();
        navigation.navigate(Routes.HomeStack.HomeTabs.SyncData);
      } catch (error) {
        setErrorMessage(error.message);
      }
    }, [selectedPatient],
  );

  setStatusBar('light-content', theme.colors.PRIMARY_MAIN);

  if (errorMessage) return <ErrorScreen error={errorMessage} />;

  return (
    <Screen
      selectedPatient={selectedPatient}
      navigateToSearchPatients={onNavigateToSearchPatients}
      visitTypeButtons={visitTypeButtons}
      patientMenuButtons={patientMenuButtons}
      navigateToPatientActions={onNavigateToPatientActions}
      markPatientForSync={onSyncPatient}
    />
  );
};
export const PatientHome = compose(withPatient)(PatientHomeContainer);
