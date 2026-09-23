import React, { useEffect } from 'react';
import { useFormikContext } from 'formik';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { dependsOn } from '~/ui/hooks/queries/queryMeta';
import { Field } from '../FormField';
import { SurveyResultBadge } from '../../SurveyResultBadge';

export const SurveyResult = ({ patient, config, name }) => {
  const { setFieldValue } = useFormikContext();

  const { data: responses } = useQuery({
    queryKey: patientKeys.surveyResponses(patient.id, config.source),
    queryFn: () =>
      Database.models.SurveyResponse.getForPatient({
        patientId: patient.id,
        surveyId: config.source,
        limit: 1,
      }),
    meta: dependsOn(
      Database.models.SurveyResponse,
      Database.models.Encounter,
      Database.models.Survey,
      Database.models.ProcedureSurveyResponse,
    ),
  });
  const surveyResponse = responses?.[0];

  useEffect(() => {
    if (surveyResponse) setFieldValue(name, surveyResponse.resultText);
  }, [surveyResponse, name, setFieldValue]);

  if (!surveyResponse) return <Text>Survey (id: {config.source}) not submitted for patient.</Text>;
  const SurveyBadgeField = () => (
    <View>
      <Text variant="titleMedium">CVD Risk</Text>
      <SurveyResultBadge resultText={surveyResponse.resultText} />
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
};
