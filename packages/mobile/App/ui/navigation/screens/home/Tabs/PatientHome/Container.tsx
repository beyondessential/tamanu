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
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

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

const PatientHomeContainer = ({
  navigation,
  selectedPatient,
}: PatientHomeScreenProps): ReactElement => {
  const [errorMessage, setErrorMessage] = useState();
  const visitTypeButtons = useMemo(
    () => [
      {
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
        title: <TranslatedText stringId="patient.vitals.title" fallback="Vitals" />,
        Icon: Icons.VitalsIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.VitalsStack.Index),
      },
      {
        title: <TranslatedText stringId="patient.programs.title" fallback="Programs" />,
        Icon: Icons.PregnancyIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.ProgramStack.Index),
      },
      {
        title: <TranslatedText stringId="patient.referral.title" fallback="Referral" />,
        Icon: Icons.FamilyPlanningIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.ReferralStack.Index),
      },
      {
        title: <TranslatedText stringId="patient.vaccine.title" fallback="Vaccine" />,
        Icon: Icons.VaccineIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.VaccineStack.Index),
      },
      {
        title: <TranslatedText stringId="patient.tests.title" fallback="Tests" />,
        Icon: Icons.LabRequestIcon,
        onPress: (): void => navigation.navigate(Routes.HomeStack.LabRequestStack.Index),
      },
    ],
    [],
  );

  const patientMenuButtons = useMemo(
    () => [
      {
        title: (
          <TranslatedText stringId="patient.details.action.view" fallback="View patient details" />
        ),
        onPress: (): void => navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index),
      },
      {
        title: <TranslatedText stringId="patient.history.action.view" fallback="View history" />,
        onPress: (): void => navigation.navigate(Routes.HomeStack.HistoryVitalsStack.Index),
      },
    ],
    [],
  );

  const onNavigateToSearchPatients = useCallback(() => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.Index);
  }, []);

  const { models, syncManager } = useBackend();
  const onSyncPatient = useCallback(async (): Promise<void> => {
    try {
      await Patient.markForSync(selectedPatient.id);
      syncManager.triggerSync({ urgent: true });
      navigation.navigate(Routes.HomeStack.HomeTabs.SyncData);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [selectedPatient]);

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

  if (errorMessage) return <ErrorScreen error={errorMessage} />;

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
