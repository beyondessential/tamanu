import React, { useEffect, useState } from 'react';
import { Text } from "react-native-paper";
import { format } from "date-fns";
import { useBackend } from '~/ui/hooks';
import { Field } from '../Forms/FormField';
import { TextField } from '../TextField/TextField';
import { useFormikContext } from 'formik';

export const SurveyLink = ({ selectedPatient, surveyId, questionId }) => {
  const [surveyResponse, setSurveyResponse] = useState();
  const { setFieldValue } = useFormikContext();
  const { models } = useBackend();

  useEffect(() => {
    (async (): Promise<void> => {
      const responses = await models.SurveyResponse.getForPatient(selectedPatient.id, surveyId);
      if (responses.length === 0) return;
      setSurveyResponse(responses[0]); // getForPatient returns responses sorted by most recent, we want the most recent.
      setFieldValue(questionId, responses[0].id)
    })();
  }, [selectedPatient, surveyId]);
  
  if (!surveyResponse) return <Text>Survey (id: {surveyId}) not submitted for patient.</Text>;

  return (
    <Field
      component={TextField}
      label={`Attached survey`}
      placeholder={`${surveyResponse.survey.name} (${format(surveyResponse.endTime, 'dd-MM-yyyy')})`}
      disabled
    />
  );
}
