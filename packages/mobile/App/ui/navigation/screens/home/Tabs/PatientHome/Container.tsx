import { useFocusEffect, useIsFocused } from '@react-navigation/core';
import React, { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StatusBar } from 'react-native';
import { compose } from 'redux';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { PatientFromRoute } from '~/ui/helpers/constants';
import usePatientIssuesQuery from '~/ui/hooks/queries/usePatientIssuesQuery';
import { Screen } from './Screen';
import * as Icons from '/components/Icons';
import { withPatient } from '/containers/Patient';
import { Routes } from '/helpers/routes';
import type { PatientHomeScreenProps } from '/interfaces/Screens/HomeStack/PatientHomeProps';
import { theme } from '/styled/theme';
import { PatientIssueType } from '/types/IPatientIssue';

interface PatientModuleLayout {
  sortPriority: number;
  hidden: boolean;
}

interface PatientModulesLayout {
  diagnosisAndTreatment: PatientModuleLayout;
  programs: PatientModuleLayout;
  /** Lives in the patient menu rather than the module grid, so it has no sort priority */
  programRegistries: Pick<PatientModuleLayout, 'hidden'>;
  referral: PatientModuleLayout;
  tests: PatientModuleLayout;
  vaccine: PatientModuleLayout;
  vitals: PatientModuleLayout;
}

function formatWarningsAsUnorderedList(notes: string[]): string {
  return notes.map(note => `• ${note}`).join('\n');
}

const usePatientModules = navigation => {
  const { getSetting } = useSettings();
  const config = getSetting<PatientModulesLayout>('layouts.mobilePatientModules');

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
  const canViewProgramRegistries =
    ability.can('list', 'PatientProgramRegistration') ||
    ability.can('create', 'PatientProgramRegistration');

  const { getSetting } = useSettings();
  const config = getSetting<PatientModulesLayout>('layouts.mobilePatientModules');

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
  const { from } = route.params || {};

  const patientMenuButtons = usePatientMenuButtons(navigation);
  const { getTranslation } = useTranslation();

  const onNavigateToSearchPatients = useCallback(() => {
    if (from === PatientFromRoute.ALL_PATIENT || from === PatientFromRoute.RECENTLY_VIEWED) {
      navigation.navigate(Routes.HomeStack.SearchPatientStack.Index, {
        screen: Routes.HomeStack.SearchPatientStack.Index,
        params: {
          screen: Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index,
          from: from,
        },
      });
    } else {
      // Don't use goBack() — it bubbles to the Home stack and can land on
      // RegisterPatientStack after patient registration. Navigate explicitly instead.
      navigation.navigate(Routes.HomeStack.HomeTabs.Index, {
        screen: Routes.HomeStack.HomeTabs.Home,
      });
    }
    setSelectedPatient(null);
  }, [from, navigation, setSelectedPatient]);

  const { data: patientIssues, error: patientIssuesError } = usePatientIssuesQuery(
    selectedPatient?.id,
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') StatusBar.setBackgroundColor(theme.colors.PRIMARY_MAIN);
      StatusBar.setBarStyle('light-content');
    }, []),
  );

  const isFocused = useIsFocused();
  const [prevPatientId, setPrevPatientId] = useState<string | null>(null);
  useEffect(() => {
    if (!isFocused || !selectedPatient || prevPatientId === selectedPatient.id) return;

    const warningNotes = patientIssues
      ?.filter(pi => pi.type === PatientIssueType.Warning)
      .map(pi => pi.note);
    if (warningNotes === undefined || warningNotes.length === 0) return;

    setPrevPatientId(selectedPatient.id);
    Alert.alert(
      getTranslation('patient.warning.title', 'Patient warnings'),
      formatWarningsAsUnorderedList(warningNotes),
    );
  }, [getTranslation, isFocused, patientIssues, prevPatientId, selectedPatient]);

  const patientModules = usePatientModules(navigation);

  if (patientIssuesError) return <ErrorScreen error={patientIssuesError} />;

  if (!selectedPatient) return null;

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
