import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';

import { StyledView } from '/styled/common';
import { useBackend } from '~/ui/hooks';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { useFormikContext } from 'formik';

export const SurveyAnswerField = ({ patient, name, config, defaultText }) => {
  const [surveyResponseAnswer, setSurveyResponseAnswer] = useState();
  const { setFieldValue } = useFormikContext();
  const { models } = useBackend();

  useEffect(() => {
    (async () => {
      const answer = await models.ReferralQuestion.getLatestAnswerForPatient(patient.id, config.source);
      setSurveyResponseAnswer(answer ? answer.body : '');
      setFieldValue(name, (answer && answer.body))
    })();
  }, [patient.id, surveyResponseAnswer])

  return (
    <StyledView marginTop={10}>
      <Field
        component={TextField}
        name={name}
        label={defaultText}
        value={surveyResponseAnswer || 'Answer not submitted'}
        disabled
      />
    </StyledView>
  )
}
