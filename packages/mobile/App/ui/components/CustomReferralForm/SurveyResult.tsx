import React, { useEffect, useState, useCallback, FC } from 'react';
import { View } from 'react-native';
import { Subheading, Text } from "react-native-paper";
import { useBackend } from '~/ui/hooks';
import { Field } from '../Forms/FormField';
import { SurveyResultBadge } from '../SurveyResultBadge';

export const SurveyResult = ({ selectedPatient, surveyId }) => {
  const [surveyResponse, setSurveyResponse] = useState();
  const { models } = useBackend();

  useEffect(() => {
    (async (): Promise<void> => {
      const responses = await models.SurveyResponse.getForPatient(selectedPatient.id, surveyId);
      setSurveyResponse(responses[0]); // getForPatient returns responses sorted by most recent, we want the most recent.
    })();
  }, [selectedPatient, surveyId]);

  if (!surveyResponse) return <Text>Survey (id: {surveyId}) not submitted for patient.</Text>;
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
