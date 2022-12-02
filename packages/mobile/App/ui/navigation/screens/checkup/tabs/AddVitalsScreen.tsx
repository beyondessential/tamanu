import React, { ReactElement, useState } from 'react';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { SectionHeader } from '/components/SectionHeader';
import { useBackend, useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '/components/ErrorScreen';
import { LoadingScreen } from '/components/LoadingScreen';
import { SurveyForm } from '/components/Forms/SurveyForm';
import { FullView } from '/styled/common';
import { useSelector } from 'react-redux';
import { ReduxStoreProps } from '/interfaces/ReduxStoreProps';
import { PatientStateProps } from '/store/ducks/patient';
import { authUserSelector } from '/helpers/selectors';
import { SurveyTypes } from '~/types';

export const AddVitalsScreen = () => {
  const [survey, surveyError] = useBackendEffect(({ models }) =>
    models.Survey.getRepository().findOne('program-patientvitals-patientvitals'),
  );

  console.log('survey', survey);

  const [components, componentsError] = useBackendEffect(() => survey && survey.getComponents(), [
    survey,
  ]);

  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  const user = useSelector(authUserSelector);

  const [note, setNote] = useState('Waiting for submission attempt.');

  const { models } = useBackend();

  const onSubmit = async (values: any) => {
    console.log('submit');

    const response = await models.SurveyResponse.submit(
      selectedPatient.id,
      user.id,
      {
        surveyId: 'program-patientvitals-patientvitals',
        components,
        surveyType: SurveyTypes.vitals,
        encounterReason: `Survey response for ${survey.name}`,
      },
      values,
      setNote,
    );

    if (!response) {
      console.log('error');
      return;
    }
  };

  if (surveyError) {
    console.log('survey', surveyError);
    return <ErrorScreen error={surveyError} />;
  }

  if (componentsError) {
    console.log('componentsError', componentsError);
    return <ErrorScreen error={componentsError} />;
  }

  if (!survey || !components) {
    return <LoadingScreen />;
  }

  return (
    <FormScreenView>
      <SectionHeader h3>VITALS READINGS</SectionHeader>
      <FullView>
        <SurveyForm
          patient={selectedPatient}
          note={note}
          components={components}
          onSubmit={onSubmit}
        />
      </FullView>
    </FormScreenView>
  );
};
