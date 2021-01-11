import React, {
  useMemo,
  useRef,
  useCallback,
  ReactElement,
  useState,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import { Screen } from './Screen';
import { StyledText, StyledView } from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ProgramAddDetailsScreenProps } from '/interfaces/screens/ProgramsStack/ProgramAddDetails/ProgramAddDetailsScreenProps';
import { Routes } from '/helpers/routes';

import { ISurveyScreenComponent, DataElementType } from '~/types/ISurvey';

import { useBackend, useBackendEffect } from '~/ui/hooks';

export const ProgramAddDetailsScreen = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { surveyId, selectedPatient } = route.params;
  const selectedPatientId = selectedPatient.id;
  const navigation = useNavigation();

  const [note, setNote] = useState("Waiting for submission attempt.");
  const [survey, error] = useBackendEffect(
    ({ models }) => models.Survey.getRepository().findOne(surveyId),
  );

  const { models } = useBackend();
  const onSubmitForm = useCallback(
    async (values: any, components: ISurveyScreenComponent[]) => {
      const response = await models.SurveyResponse.submit(
        selectedPatientId,
        {
          surveyId,
          components,
          encounterReason: `Survey response for ${survey.name}`,
        },
        values,
        setNote,
      );

      if(!response) return;

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
      note={note}
    />
  );
};
