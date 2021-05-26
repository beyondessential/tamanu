import React, { ReactElement, useMemo, useCallback, useState, useEffect } from 'react';
import { compose } from 'redux';
import { setStatusBar } from '/helpers/screen';
import { Popup } from 'popup-ui';
// Components
import * as Icons from '/components/Icons';
import { PatientHomeScreenProps } from '/interfaces/screens/HomeStack';
import { Screen } from './Screen';
// Helpers
import { Routes } from '/helpers/routes';
import { theme } from '/styled/theme';
// Containers
import { withPatient } from '/containers/Patient';
import { useBackend, useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { useIsFocused } from '@react-navigation/core';

const PatientHomeContainer = ({
  navigation,
  selectedPatient,
}: PatientHomeScreenProps): ReactElement => {
  const isFocused = useIsFocused(); // reload issues whenever the page is focused
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
        onPress: (): void => navigation.navigate(Routes.HomeStack.ProgramStack.ReferralTabs.Index),
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
        title: 'View patient details',
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

  setStatusBar('light-content', theme.colors.PRIMARY_MAIN);

  if (errorMessage) return <ErrorScreen error={errorMessage} />;

  console.log(patientIssues, issuesError);
  useEffect(() => {
    Popup.show({
      type: 'Warning',
      title: 'Vaccine Warning',
      button: true,
      textBody: `This person has previously had an adverse reaction to a vaccine. DO NOT VACCINATE & REFER PATIENT TO EPI COORDINATOR.`,
      buttonText: 'Ok',
      callback: () => {
        // navigation.replace(resetRoute);
        Popup.hide();
      },
    });
  }, [patientIssues?.length ?? 0, selectedPatient.id]);

  return (
    <Screen
      selectedPatient={selectedPatient}
      navigateToSearchPatients={onNavigateToSearchPatients}
      visitTypeButtons={visitTypeButtons}
      patientMenuButtons={patientMenuButtons}
      markPatientForSync={onSyncPatient}
    />
  );
};
export const PatientHome = compose(withPatient)(PatientHomeContainer);
