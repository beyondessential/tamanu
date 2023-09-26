import React, {
  useCallback,
  ReactElement,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { FullView } from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { SurveyResponseScreenProps } from '/interfaces/Screens/ProgramsStack/SurveyResponseScreen';
import { Routes } from '/helpers/routes';
import { SurveyForm } from '~/ui/components/Forms/SurveyForm';

import { useBackend, useBackendEffect } from '~/ui/hooks';
import { SurveyTypes, GenericFormValues } from '~/types';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { authUserSelector } from '~/ui/helpers/selectors';

export const SurveyResponseScreen = ({
  route,
}: SurveyResponseScreenProps): ReactElement => {
  const { surveyId, selectedPatient, surveyType } = route.params;
  const isReferral = surveyType === SurveyTypes.Referral;
  const selectedPatientId = selectedPatient.id;
  const navigation = useNavigation();

  const [note, setNote] = useState('');

  const [survey, surveyError, isSurveyLoading] = useBackendEffect(
    ({ models }) => models.Survey.getRepository().findOne(surveyId),
  );

  const [components, componentsError, areComponentsLoading] = useBackendEffect(
    () => survey && survey.getComponents(),
    [survey],
  );

  const [patientAdditionalData, padError, isPadLoading] = useBackendEffect(
    ({ models }) => models.PatientAdditionalData.getRepository().findOne({
      patient: selectedPatient.id,
    }),
    [selectedPatient.id],
  );

  const user = useSelector(authUserSelector);

  const { models } = useBackend();
  const onSubmit = useCallback(
    async (values: GenericFormValues) => {
      const model = isReferral ? models.Referral : models.SurveyResponse;
      const response = await model.submit(
        selectedPatientId,
        user.id,
        {
          surveyId,
          components,
          surveyType,
          encounterReason: `Survey response for ${survey.name}`,
        },
        values,
        setNote,
      );

      if (!response) return;
      if (isReferral) {
        navigation.navigate(
          Routes.HomeStack.ReferralStack.ViewHistory.Index,
          {
            surveyId: surveyId,
            latestResponseId: response.id,
          },
        );
        return;
      }

      navigation.navigate(
        Routes.HomeStack.ProgramStack.ProgramTabs.ViewHistory,
        {
          surveyId: surveyId,
          latestResponseId: response.id,
        },
      );
    },
    [survey, components],
  );

  const error = surveyError || componentsError || padError;
  // due to how useBackendEffect works we need to stay in the loading state for queries which depend
  // on other data, like the query for components
  const isLoading = !survey || isSurveyLoading || areComponentsLoading || isPadLoading;
  if (error) {
    return <ErrorScreen error={error} />;
  }
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary resetRoute={Routes.HomeStack.ProgramStack.ProgramListScreen}>
      <FullView>
        <SurveyForm
          patient={selectedPatient}
          patientAdditionalData={patientAdditionalData}
          components={components}
          onSubmit={onSubmit}
        />
      </FullView>
    </ErrorBoundary>
  );
};
