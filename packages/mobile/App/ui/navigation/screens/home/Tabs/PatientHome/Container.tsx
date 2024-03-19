import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { compose } from 'redux';
import { useFocusEffect } from '@react-navigation/core';
import { setStatusBar } from '/helpers/screen';
import { Popup } from 'popup-ui';
import { IPatientIssue, PatientIssueType } from '/types/IPatientIssue';
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
import { Patient } from '../../../../../../models/Patient';
import { useAuth } from '~/ui/contexts/AuthContext';
import { PatientFromRoute } from '~/ui/helpers/constants';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';

interface IPopup {
  title: string;
  textBody: string;
}

const showPopupChain = (popups: IPopup[]): void => {
  if (popups.length === 0) return;
  const [currentPopup, ...restOfChain] = popups;
  const { title, textBody } = currentPopup;

  Popup.show({
    type: 'Warning',
    title,
    textBody,
    callback: () => {
      if (restOfChain.length > 0) {
        showPopupChain(restOfChain);
      } else {
        Popup.hide();
      }
    },
  });
};

const formatNoteToPopup = (note: string): IPopup => {
  const [firstPart, secondPart] = note.split(/:(.+)/);
  return secondPart
    ? {
        title: firstPart,
        textBody: secondPart,
      }
    : {
        title: '',
        textBody: firstPart,
      };
};

const showPatientWarningPopups = (issues: IPatientIssue[]): void =>
  showPopupChain(
    issues
      .filter(({ type }) => type === PatientIssueType.Warning)
      .map(({ note }) => formatNoteToPopup(note)),
  );

const usePatientModules = navigation => {
  const { getLocalisation } = useLocalisation();
  const config = getLocalisation('layouts.mobilePatientModules');

  return useMemo(() => {
    return [
      {
        key: 'diagnosisAndTreatment',
        title: 'Diagnosis &\nTreatment',
        Icon: Icons.DiagnosisAndTreatmentIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.DiagnosisAndTreatmentTabs.Index),
      },
      {
        key: 'vitals',
        title: 'Vitals',
        Icon: Icons.VitalsIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.VitalsStack.Index),
      },
      {
        key: 'programs',
        title: 'Programs',
        Icon: Icons.PregnancyIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.ProgramStack.Index),
      },
      {
        key: 'referral',
        title: 'Referral',
        Icon: Icons.FamilyPlanningIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.ReferralStack.Index),
      },
      {
        key: 'vaccine',
        title: 'Vaccine',
        Icon: Icons.VaccineIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.VaccineStack.Index),
      },
      {
        key: 'tests',
        title: 'Tests',
        Icon: Icons.LabRequestIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.LabRequestStack.Index),
      },
    ]
      .filter(module => config?.[module.key]?.hidden === false)
      .sort((a, b) => config[a.key].sortPriority - config[b.key].sortPriority);
  }, [navigation, config]);
};

const PatientHomeContainer = ({
  navigation,
  selectedPatient,
  setSelectedPatient,
  route,
}: PatientHomeScreenProps): ReactElement => {
  const { ability } = useAuth();
  const canListRegistrations = ability.can('list', 'PatientProgramRegistration');
  const canCreateRegistration = ability.can('create', 'PatientProgramRegistration');
  const canViewProgramRegistries = canListRegistrations || canCreateRegistration;
  const [errorMessage, setErrorMessage] = useState();
  const { from } = route.params || {};

  const patientMenuButtons = useMemo(
    () => [
      {
        title: 'View patient details',
        onPress: (): void => navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index),
      },
      {
        title: 'View history',
        onPress: (): void => navigation.navigate(Routes.HomeStack.HistoryVitalsStack.Index),
      },
      {
        title: 'Program registries',
        onPress: (): void => navigation.navigate(Routes.HomeStack.PatientSummaryStack.Index),
        hideFromMenu: !canViewProgramRegistries,
      },
    ],
    [navigation, canViewProgramRegistries],
  );

  const onNavigateToSearchPatients = useCallback(() => {
    setSelectedPatient(null);
    if (from === PatientFromRoute.ALL_PATIENT || from === PatientFromRoute.RECENTLY_VIEWED) {
      navigation.navigate(Routes.HomeStack.SearchPatientStack.Index, {
        screen: Routes.HomeStack.SearchPatientStack.Index,
        params: {
          screen: Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index,
          from: from,
        },
      });
    } else {
      navigation.goBack();
    }
  }, [from, navigation, setSelectedPatient]);

  const { models, syncManager } = useBackend();
  const onSyncPatient = useCallback(async (): Promise<void> => {
    try {
      await Patient.markForSync(selectedPatient.id);
      syncManager.triggerSync({ urgent: true });
      navigation.navigate(Routes.HomeStack.HomeTabs.SyncData);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [navigation, syncManager, selectedPatient]);

  const [patientIssues, setPatientIssues] = useState(null);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async (): Promise<void> => {
        try {
          const result = await models.PatientIssue.find({
            order: { recordedDate: 'ASC' },
            where: { patient: { id: selectedPatient.id } },
          });
          if (!mounted) {
            return;
          }
          setPatientIssues(result);
        } catch (err) {
          if (!mounted) {
            return;
          }
          setErrorMessage(err.message);
        }
      })();
      return (): void => {
        mounted = false;
      };
    }, [models, selectedPatient.id]),
  );

  setStatusBar('light-content', theme.colors.PRIMARY_MAIN);

  useEffect(() => {
    showPatientWarningPopups(patientIssues || []);
  }, [patientIssues]);

  const patientModules = usePatientModules(navigation);

  if (errorMessage) return <ErrorScreen error={errorMessage} />;

  return (
    <Screen
      selectedPatient={selectedPatient}
      navigateToSearchPatients={onNavigateToSearchPatients}
      visitTypeButtons={patientModules}
      patientMenuButtons={patientMenuButtons}
      markPatientForSync={onSyncPatient}
    />
  );
};
export const PatientHome = compose(withPatient)(PatientHomeContainer);
