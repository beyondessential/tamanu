import React, { useEffect, useState } from 'react';
import { Text } from "react-native-paper";
import { format } from "date-fns";
import { useBackend } from '~/ui/hooks';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { useFormikContext } from 'formik';

export const SurveyLink = ({ patient, config, name }) => {
  const [surveyResponse, setSurveyResponse] = useState();
  const { setFieldValue } = useFormikContext();
  const { models } = useBackend();
  const { surveyId } = config;

  useEffect(() => {
    (async (): Promise<void> => {
      const responses = await models.SurveyResponse.getForPatient(patient.id, surveyId);
      if (responses.length === 0) return;
      setSurveyResponse(responses[0]); // getForPatient returns responses sorted by most recent, we want the most recent.
      setFieldValue(name, responses[0].id)
    })();
  }, [patient, surveyId]);
  
  if (!surveyResponse) return <Text>Survey (id: {surveyId}) not submitted for patient.</Text>;

  return (
    <Field
      component={TextField}
      label={`Attached screening form`}
      placeholder={`${surveyResponse.survey.name} (${format(surveyResponse.endTime, 'dd-MM-yyyy')})`}
      disabled
      name={name}
    />
  );
}
