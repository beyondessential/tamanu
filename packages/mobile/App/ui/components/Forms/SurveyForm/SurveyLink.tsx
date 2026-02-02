import React, { ReactElement, useEffect, useState } from 'react';
import { Text } from 'react-native-paper';
import { useFormikContext } from 'formik';
import { ISurveyResponse } from '~/types';
import { useBackend } from '~/ui/hooks';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';

export const SurveyLink = ({ patient, config, name }): ReactElement => {
  const [surveyResponse, setSurveyResponse] = useState<ISurveyResponse | undefined>();
  const { setFieldValue } = useFormikContext();
  const { models } = useBackend();
  const { formatShort } = useDateTimeFormat();
  const { source } = config;

  useEffect(() => {
    (async (): Promise<void> => {
      const responses = await models.SurveyResponse.getForPatient(patient.id, source);
      if (responses.length === 0) {
        return;
      }
      // getForPatient returns responses sorted by most recent, we want the most recent.
      setSurveyResponse(responses[0]);
      setFieldValue(name, responses[0].id);
    })();
  }, [patient, source]);

  if (!surveyResponse) {
    return (
      <Text accessibilityComponentType={undefined} accessibilityTraits={undefined}>
        Survey (id: {source}) not submitted for patient.
      </Text>
    );
  }

  const attachedScreeningValue = `${
    typeof surveyResponse.survey === 'string' ? surveyResponse.survey : surveyResponse.survey.name
  } (${formatShort(surveyResponse.endTime)})`;

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
