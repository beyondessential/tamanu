import React, { useEffect, useState, useCallback, FC } from 'react';
import { useFormikContext } from 'formik';
import { View } from 'react-native';
import { Subheading, Text } from "react-native-paper";
import { useBackend } from '~/ui/hooks';
import { Field } from '../FormField';
import { SurveyResultBadge } from '../../SurveyResultBadge';

export const SurveyResult = ({ patient, config, name }) => {
  const [surveyResponse, setSurveyResponse] = useState();
  const { setFieldValue } = useFormikContext();
  const { models } = useBackend();

  useEffect(() => {
    (async (): Promise<void> => {
      const responses = await models.SurveyResponse.getForPatient(patient.id, config.source);
      if (responses.length === 0) return;
      setSurveyResponse(responses[0]); // getForPatient returns responses sorted by most recent, we want the most recent.
      setFieldValue(name, responses[0].resultText || responses[0].resultText)
    })();
  }, [patient, config.source]);

  if (!surveyResponse) return <Text>Survey (id: {config.source}) not submitted for patient.</Text>;
  const SurveyBadgeField = () => (
    <View>
      <Subheading>CVD Risk</Subheading>
      <SurveyResultBadge result={surveyResponse.result} resultText={surveyResponse.resultText} />
    </View>
  );
  return (
    <Field
      component={SurveyBadgeField}
      label={`CVD Risk`}
      name="surveyResult"
      value={surveyResponse.resultText || surveyResponse.result}
      disabled
    />
  );
}
