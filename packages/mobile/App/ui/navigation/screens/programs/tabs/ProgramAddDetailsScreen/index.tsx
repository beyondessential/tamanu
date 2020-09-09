import React, {
  useMemo,
  useRef,
  useCallback,
  ReactElement,
  useState,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import { Screen } from './Screen';
import { StyledText } from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ProgramAddDetailsScreenProps } from '/interfaces/screens/ProgramsStack/ProgramAddDetails/ProgramAddDetailsScreenProps';
import { Routes } from '/helpers/routes';

import { useBackend, useBackendEffect } from '~/ui/helpers/hooks';

export const ProgramAddDetailsScreen = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { surveyId, selectedPatient } = route.params;
  const selectedPatientId = selectedPatient.id;
  const navigation = useNavigation();
  const containerScrollView = useRef<any>(null);

  const scrollTo = useCallback(
    (verticalPosition: { x: number; y: number }) => {
      if (containerScrollView) {
        containerScrollView.current.scrollTo(verticalPosition);
      }
    },
    [containerScrollView],
  );

  const [survey, error] = useBackendEffect(({ models }) =>
    models.Survey.getRepository().findOne(surveyId),
  );

  const { models } = useBackend();
  const onSubmitForm = useCallback(
    async (values: any) => {
      // TODO: determine results for all calculated answer types
      // (here? or possibly dynamically inside form)
      const result = Math.random() * 100.0;

      const response = await models.SurveyResponse.submit(
        selectedPatientId,
        {
          surveyId,
          encounterReason: `Survey response for ${survey.name}`,
          result,
        },
        values,
      );

      navigation.navigate(
        Routes.HomeStack.ProgramStack.ProgramTabs.ViewHistory,
        {
          surveyId: surveyId,
          latestResponseId: response.id,
        },
      );
    },
    [survey],
  );

  if (!survey) {
    return <LoadingScreen />;
  }

  return (
    <Screen
      onSubmitForm={onSubmitForm}
      survey={survey}
      patient={selectedPatient}
      containerScrollView={containerScrollView}
      scrollTo={scrollTo}
    />
  );
};
