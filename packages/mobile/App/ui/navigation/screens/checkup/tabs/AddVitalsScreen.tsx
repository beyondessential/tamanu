import React, { ReactElement, useState } from 'react';
import { FormScreenView } from '/components/Forms/FormScreenView';
import * as Yup from 'yup';
import { useBackend, useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '/components/ErrorScreen';
import { Routes } from '/helpers/routes';
import { LoadingScreen } from '/components/LoadingScreen';
import { SurveyForm } from '/components/Forms/SurveyForm';
import { FullView } from '/styled/common';
import { useSelector } from 'react-redux';
import { ReduxStoreProps } from '/interfaces/ReduxStoreProps';
import { PatientStateProps } from '/store/ducks/patient';
import { authUserSelector } from '/helpers/selectors';
import { SurveyTypes } from '~/types';
import { getCurrentDateTimeString } from '/helpers/date';

const numericType = Yup.number()
  .nullable()
  .transform(value => {
    if (Number.isNaN(value)) {
      return null;
    }
    return value;
  });

const readingFields = {
  weight: numericType,
  height: numericType,
  sbp: numericType,
  dbp: numericType,
  heartRate: numericType,
  respiratoryRate: numericType,
  temperature: numericType,
  spo2: numericType,
  avpu: Yup.string(), // AVPUType
};

export const AddVitalsScreen = ({ navigation }) => {
  const [survey, surveyError] = useBackendEffect(({ models }) =>
    models.Survey.getRepository().findOne('program-patientvitals-patientvitals'),
  );

  const [components, componentsError] = useBackendEffect(() => survey && survey.getComponents(), [
    survey,
  ]);

  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  const user = useSelector(authUserSelector);

  const [note, setNote] = useState('Waiting for submission attempt.');

  const { models } = useBackend();

  const validationSchema = Yup.object().shape({
    ...readingFields,
    comment: Yup.string(),
  });

  const requiresOneOfFields = Object.keys(readingFields);

  const validate = (values: object): object => {
    const hasAtLeastOneReading = !Object.entries(values).some(([key, value]) => {
      // Only check fields containing a vital reading
      if (requiresOneOfFields.includes(key) === false) {
        return false;
      }

      // Check if value is truthy (not 0 or empty string)
      return !!value;
    });

    if (hasAtLeastOneReading) {
      return {
        form: 'At least one vital must be recorded.',
      };
    }

    return {};
  };

  const navigateToHistory = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.HomeStack.CheckUpStack.CheckUpTabs.ViewHistory }],
    });
  };

  const onSubmit = async (values: any) => {
    const dateComponent = components.find(c => c.dataElementId === 'pde-PatientVitalsDate');

    const response = await models.SurveyResponse.submit(
      selectedPatient.id,
      user.id,
      {
        surveyId: 'program-patientvitals-patientvitals',
        components,
        surveyType: SurveyTypes.Vitals,
        encounterReason: `Survey response for ${survey.name}`,
      },
      { ...values, [dateComponent.dataElement.code]: getCurrentDateTimeString() },
      setNote,
    );

    if (!response) {
      console.log('error');
      return;
    }
    navigateToHistory();
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

  // On mobile, date is programmatically submitted
  const mobileFormComponents = components.filter(c => c.dataElementId !== 'pde-PatientVitalsDate');
  return (
    <FormScreenView>
      <FullView>
        <SurveyForm
          patient={selectedPatient}
          note={note}
          components={mobileFormComponents}
          onSubmit={onSubmit}
        />
      </FullView>
    </FormScreenView>
  );
};
