import React, { useMemo, useRef, useCallback, ReactElement, useState } from 'react';
import { Screen } from './Screen';
import { StyledText } from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ProgramAddDetailsScreenProps } from '/interfaces/screens/ProgramsStack/ProgramAddDetails/ProgramAddDetailsScreenProps';
import { useNavigation } from '@react-navigation/native';
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

  const { models } = useBackend();
  const onSubmitForm = useCallback(async (values: any) => {
    await models.SurveyResponse.submit(surveyId, selectedPatientId, values);

    /*
    navigation.navigate(
      Routes.HomeStack.ProgramStack.ProgramTabs.ViewHistory,
      {
        surveyId: survey.id,
      },
    );
     */
  }, []);

  const [survey, error] = useBackendEffect(({ models }) => models.Survey.getRepository().findOne(surveyId));

  if(!survey) {
    return <LoadingScreen text="Getting survey details..." />;
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
