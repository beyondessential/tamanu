import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { compose } from 'redux';
import { useFocusEffect } from '@react-navigation/core';
import { useSetStatusBar } from '/helpers/screen';
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
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useAuth } from '~/ui/contexts/AuthContext';
import { PatientFromRoute } from '~/ui/helpers/constants';
import { useSettings } from '~/ui/contexts/SettingsContext';

interface IPopup {
  title: string;
  textBody: string;
}

// TODO: declare this
type PatientModule = {};

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
  const { getSetting } = useSettings();
  const config = getSetting<PatientModule>('layouts.mobilePatientModules');

  return useMemo(() => {
    return [
      {
        key: 'diagnosisAndTreatment',
        title: (
          <TranslatedText
            stringId="patient.diagnosisAndTreatment.title"
            fallback="Diagnosis & Treatment"
          />
        ),
        Icon: Icons.DiagnosisAndTreatmentIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.DiagnosisAndTreatmentTabs.Index),
      },
      {
        key: 'vitals',
        title: <TranslatedText stringId="patient.vitals.title" fallback="Vitals" />,
        Icon: Icons.VitalsIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.VitalsStack.Index),
      },
      {
        key: 'programs',
        title: <TranslatedText stringId="patient.programs.title" fallback="Programs" />,
        Icon: Icons.PregnancyIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.ProgramStack.Index),
      },
      {
        key: 'referral',
        title: <TranslatedText stringId="patient.referral.title" fallback="Referral" />,
        Icon: Icons.FamilyPlanningIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.ReferralStack.Index),
      },
      {
        key: 'vaccine',
        title: <TranslatedText stringId="patient.vaccine.title" fallback="Vaccine" />,
        Icon: Icons.VaccineIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.VaccineStack.Index),
      },
      {
        key: 'tests',
        title: <TranslatedText stringId="patient.tests.title" fallback="Tests" />,
        Icon: Icons.LabRequestIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.LabRequestStack.Index),
      },
    ]
      .filter(module => config[module.key].hidden === false)
      .sort((a, b) => config[a.key].sortPriority - config[b.key].sortPriority);
  }, [navigation, config]);
};

const usePatientMenuButtons = navigation => {
  const { ability } = useAuth();
  const { getSetting } = useSettings();
  const canListRegistrations = ability.can('list', 'PatientProgramRegistration');
  const canCreateRegistration = ability.can('create', 'PatientProgramRegistration');
  const canViewProgramRegistries = canListRegistrations || canCreateRegistration;
  const config = getSetting('layouts.mobilePatientModules');

  return useMemo(
    () =>
      [
        {
          key: 'patientDetails',
          title: (
            <TranslatedText
              stringId="patient.action.viewPatientDetails"
              fallback="View patient details"
            />
          ),
          onPress: (): void => navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index),
        },
        {
          key: 'history',
          title: (
            <TranslatedText stringId="patient.action.viewVitalHistory" fallback="View history" />
          ),
          onPress: (): void => navigation.navigate(Routes.HomeStack.HistoryVitalsStack.Index),
        },
        {
          key: 'programRegistries',
          title: (
            <TranslatedText stringId="programRegistry.header.title" fallback="Program registries" />
          ),
          onPress: (): void => navigation.navigate(Routes.HomeStack.PatientSummaryStack.Index),
          hideFromMenu: !canViewProgramRegistries,
        },
      ].filter(module => {
        // patientDetails and history are always visible
        return module.key !== 'programRegistries' || config[module.key]?.hidden === false;
      }),
    [navigation, config, canViewProgramRegistries],
  );
};

const PatientHomeContainer = ({
  navigation,
  selectedPatient,
  setSelectedPatient,
  route,
}: PatientHomeScreenProps): ReactElement => {
  const [errorMessage, setErrorMessage] = useState();
  const { from } = route.params || {};

  const patientMenuButtons = usePatientMenuButtons(navigation);

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

  const { models } = useBackend();

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

  useSetStatusBar('light-content', theme.colors.PRIMARY_MAIN);

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
    />
  );
};
export const PatientHome = compose(withPatient)(PatientHomeContainer);
