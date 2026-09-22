import { subject } from '@casl/ability';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { type ReactElement, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { Database } from '~/infra/db';
import { type GenericFormValues, type IPatientAdditionalData, SurveyTypes } from '~/types';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { SurveyForm } from '~/ui/components/Forms/SurveyForm';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { StackHeader } from '~/ui/components/StackHeader';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { resetToProgramSurveyHistory, resetToReferralHistory } from '~/ui/helpers/navigators';
import { authUserSelector } from '~/ui/helpers/selectors';
import { joinNames } from '~/ui/helpers/user';
import { useBackend } from '~/ui/hooks';
import { patientKeys, surveyKeys } from '~/ui/hooks/queries/queryKeys';
import usePatientAdditionalDataRecordQuery from '~/ui/hooks/queries/usePatientAdditionalDataRecordQuery';
import { useAfterSurveySubmit } from '~/ui/hooks/useAfterSurveySubmit';
import { useCurrentScreen } from '~/ui/hooks/useCurrentScreen';
import type { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import type { PatientStateProps } from '~/ui/store/ducks/patient';
import { FullView } from '~/ui/styled/common';
import { Routes } from '/helpers/routes';
import type { SurveyResponseScreenProps } from '/interfaces/Screens/ProgramsStack/SurveyResponseScreen';

export const SurveyResponseScreen = ({ route }: SurveyResponseScreenProps): ReactElement => {
  const { surveyId, surveyType } = route.params;
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );
  const isReferral = surveyType === SurveyTypes.Referral;
  const selectedPatientId = selectedPatient.id;
  const navigation = useNavigation();
  const { ability } = useAuth();
  const canReadRegistration = ability.can('read', 'PatientProgramRegistration');
  const { currentScreenIndex, onNavigatePrevious, setCurrentScreenIndex } = useCurrentScreen();
  const { getTranslation } = useTranslation();

  const {
    data: survey,
    error: surveyError,
    isPending: isSurveyLoading,
  } = useQuery({
    queryKey: surveyKeys.detail(surveyId),
    queryFn: () =>
      Database.models.Survey.getRepository().findOne({
        where: { id: surveyId },
      }),
  });

  const {
    data: components,
    error: componentsError,
    isPending: areComponentsLoading,
  } = useQuery({
    queryKey: surveyKeys.components(surveyId),
    queryFn: () => survey.getComponents({ includeAllVitals: false }),
    enabled: Boolean(survey),
  });

  const {
    data: patientAdditionalData,
    error: padError,
    isPending: isPadLoading,
  } = usePatientAdditionalDataRecordQuery(selectedPatient.id);

  const user = useSelector(authUserSelector);

  const {
    data: patientProgramRegistration,
    error: pprError,
    isPending: isPprLoading,
    // `canReadRegistration` is based on the signed-in user; encoded in query key as `user.id`
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
  } = useQuery({
    queryKey: [
      ...patientKeys.registrations(selectedPatient.id),
      'recent',
      { programId: survey?.programId, userId: user?.id },
    ],
    queryFn: async () => {
      if (canReadRegistration === false) return null;
      const patientProgramRegistry = await Database.models.PatientProgramRegistration.getRecentOne(
        survey?.programId,
        selectedPatient.id,
      );

      if (!patientProgramRegistry) {
        return null;
      }

      const canReadProgramRegistry = ability.can(
        'read',
        subject('ProgramRegistry', { id: patientProgramRegistry.programRegistryId }),
      );

      return canReadProgramRegistry ? patientProgramRegistry : null;
    },
    enabled: survey != null,
  });

  const { models } = useBackend();
  const afterSurveySubmit = useAfterSurveySubmit();
  const { mutateAsync: submitSurveyResponse } = useMutation({
    // Referral.submit and SurveyResponse.submit return different record types; the
    // caller only relies on the shared id field.
    mutationFn: (values: GenericFormValues): Promise<{ id: string } | null> => {
      const model = isReferral ? models.Referral : models.SurveyResponse;
      return model.submit(
        selectedPatientId,
        user.id,
        {
          surveyId,
          components,
          surveyType,
          encounterReason: 'Form response',
        },
        values,
      );
    },
    onSuccess: async response => {
      if (!response) return;
      await afterSurveySubmit(selectedPatientId);
    },
  });

  const onSubmit = useCallback(
    async (values: GenericFormValues) => {
      const response = await submitSurveyResponse(values);

      if (!response) return;
      if (isReferral) {
        resetToReferralHistory(navigation);
      } else {
        resetToProgramSurveyHistory(navigation, response.id);
      }
    },
    [submitSurveyResponse, isReferral, navigation],
  );

  const confirmExit = () => {
    Alert.alert(
      getTranslation('program.survey.exit.heading', 'Exit form?'),
      getTranslation('program.survey.exit.text', 'You will lose any information currently entered'),
      [
        {
          text: getTranslation('program.survey.action.stayOnPage', 'Stay on page'),
          style: 'cancel',
        },
        {
          text: getTranslation('general.action.exit', 'Exit'),
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const onGoBack = () => {
    if (currentScreenIndex > 0) {
      onNavigatePrevious();
    } else {
      confirmExit();
    }
  };

  const error = surveyError || componentsError || padError || pprError;
  const isLoading =
    !survey ||
    !components ||
    isSurveyLoading ||
    areComponentsLoading ||
    isPadLoading ||
    isPprLoading;
  if (error) {
    return <ErrorScreen error={error} />;
  }
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary resetRoute={Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.AddDetails}>
      <FullView>
        <StackHeader
          title={survey.name}
          subtitle={joinNames(selectedPatient)}
          onGoBack={onGoBack}
        />
        <SurveyForm
          patient={selectedPatient}
          // PatientAdditionalData and IPatientAdditionalData disagree on
          // patient.village.visibilityStatus (string vs enum), a pre-existing model typing quirk
          patientAdditionalData={patientAdditionalData as unknown as IPatientAdditionalData}
          patientProgramRegistration={patientProgramRegistration}
          components={components}
          onSubmit={onSubmit}
          onCancel={confirmExit}
          setCurrentScreenIndex={setCurrentScreenIndex}
          currentScreenIndex={currentScreenIndex}
          onGoBack={onGoBack}
        />
      </FullView>
    </ErrorBoundary>
  );
};
