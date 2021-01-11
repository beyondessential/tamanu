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

function getResultValues(component, value) {
  if(!component) {
    // this survey does not have a result field
    return { result: 0, resultText: '' };
  }

  if(typeof(value) === number) {
    // TODO: read formatting options from component
    return { 
      result: value,
      resultText: `${value.toFixed(0)}%`,
    };
  }

  return {
    result: 0,
    resultText: value,
  };
}

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
      // find a component with a Result data type and use its value as the overall result
      const resultComponent = components.find(c => c.dataElement.type === DataElementType.Result);

      const resultValue = values[resultComponent.dataElement.code];

      const result = resultComponent 
        ? values[resultComponent.dataElement.code] 
        : 0;

      const resultText = resultComponent 
        ? getStringValue(resultComponent.dataElement.type, resultValue)
        : '';

      const response = await models.SurveyResponse.submit(
        selectedPatientId,
        {
          surveyId,
          components,
          encounterReason: `Survey response for ${survey.name}`,
          result,
          resultText,
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
