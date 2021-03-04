import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';

import { StyledView } from '/styled/common';
import { useBackend } from '~/ui/hooks';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { useFormikContext } from 'formik';

const SurveyAnswerFieldComponent = ({ selectedPatient, questionId, source, question }) => {
  const [surveyResponseAnswer, setSurveyResponseAnswer] = useState();
  const { setFieldValue } = useFormikContext();
  const { models } = useBackend();

  useEffect(() => {
    (async () => {
      const answer = await models.ReferralQuestion.getLatestAnswerForPatient(selectedPatient.id, source);
      setSurveyResponseAnswer(answer ? answer.body : '');
      setFieldValue(questionId, (answer && answer.body))
    })();
  }, [selectedPatient.id, surveyResponseAnswer])

  return (
    <StyledView marginTop={10}>
      <Field
        component={TextField}
        name={questionId}
        label={question}
        value={surveyResponseAnswer || 'Answer not submitted'}
        disabled
      />
    </StyledView>
  )
}

export const SurveyAnswerField = compose(withPatient)(SurveyAnswerFieldComponent);
