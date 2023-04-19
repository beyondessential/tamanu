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

  const [survey, surveyError] = useBackendEffect(
    ({ models }) => models.Survey.getRepository().findOne(surveyId),
  );

  const [components, componentsError] = useBackendEffect(
    () => survey && survey.getComponents(),
    [survey],
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

  if (surveyError) {
    return <ErrorScreen error={surveyError} />;
  }

  if (componentsError) {
    return <ErrorScreen error={componentsError} />;
  }

  if (!survey || !components) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary resetRoute={Routes.HomeStack.ProgramStack.ProgramListScreen}>
      <FullView>
        <SurveyForm
          patient={selectedPatient}
          note={note}
          components={components}
          onSubmit={onSubmit}
        />
      </FullView>
    </ErrorBoundary>
  );
};
