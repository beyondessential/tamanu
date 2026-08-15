import React, { ReactElement, useEffect } from 'react';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { DateFormats } from '~/ui/helpers/constants';
import { useFormikContext } from 'formik';
import { Database } from '~/infra/db';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';

export const SurveyLink = ({ patient, config, name }): ReactElement => {
  const { setFieldValue } = useFormikContext();
  const { formatStringDate } = useDateFormatter();
  const { source } = config;

  const { data: responses } = useQuery({
    queryKey: patientKeys.surveyResponses(patient.id, source),
    queryFn: () =>
      Database.models.SurveyResponse.getForPatient({
        patientId: patient.id,
        surveyId: source,
        limit: 1,
      }),
  });
  const surveyResponse = responses?.[0];

  useEffect(() => {
    if (surveyResponse) setFieldValue(name, surveyResponse.id);
  }, [surveyResponse, name, setFieldValue]);

  if (!surveyResponse) {
    return (
      <Text accessibilityComponentType={undefined} accessibilityTraits={undefined}>
        Survey (id: {source}) not submitted for patient.
      </Text>
    );
  }

  const attachedScreeningValue = `${
    typeof surveyResponse.survey === 'string' ? surveyResponse.survey : surveyResponse.survey.name
  } (${formatStringDate(surveyResponse.endTime, DateFormats.DDMMYY)})`;

  return (
    <Field
      component={TextField}
      label="Attached screening form"
      value={attachedScreeningValue}
      disabled
      name={name}
    />
  );
};
