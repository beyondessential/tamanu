import React, {
  useMemo,
  useRef,
  useCallback,
  ReactElement,
  useState,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import { SurveyScreen } from '../SurveyScreen';
import { StyledText, StyledView, FullView } from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { SurveyResponseScreenProps } from '/interfaces/screens/ProgramsStack/SurveyResponseScreen';
import { Routes } from '/helpers/routes';
import { SurveyForm } from '~/ui/components/Forms/SurveyForm';

import { ISurveyScreenComponent } from '~/types/ISurvey';

import { useBackend, useBackendEffect } from '~/ui/hooks';
import { SurveyTypes } from '~/types';

export const SurveyResponseScreen = ({
  route,
}: SurveyResponseScreenProps): ReactElement => {
  const { surveyId, selectedPatient, surveyType } = route.params;
  const selectedPatientId = selectedPatient.id;
  const navigation = useNavigation();

  const [note, setNote] = useState("Waiting for submission attempt.");

  const [survey, surveyError] = useBackendEffect(
    ({ models }) => models.Survey.getRepository().findOne(surveyId),
  );

  const [components, componentsError] = useBackendEffect(
    () => survey && survey.getComponents(),
    [survey]
  );

  const { models } = useBackend();
  const onSubmit = useCallback(
    async (values: any) => {
      const response = await models.SurveyResponse.submit(
        selectedPatientId,
        {
          surveyId,
          components,
          surveyType,
          encounterReason: `Survey response for ${survey.name}`,
        },
        values,
        setNote,
      );

      if(!response) return;

      if(surveyType === SurveyTypes.Referral) {
        navigation.navigate(
          Routes.HomeStack.ProgramStack.ReferralTabs.ViewHistory,
          {
            surveyId: surveyId,
            latestResponseId: response.id,
          },
        );
      };

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
    <FullView>
      <SurveyForm
        survey={survey}
        patient={selectedPatient}
        note={note}
        components={components}
        onSubmit={onSubmit}
      />
    </FullView>
  );

};
