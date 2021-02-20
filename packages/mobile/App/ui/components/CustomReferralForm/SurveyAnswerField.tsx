import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';

import { StyledView } from '/styled/common';
import { useBackend } from '~/ui/hooks';
import { Field } from '../Forms/FormField';
import { TextField } from '../TextField/TextField';

const SurveyAnswerFieldComponent = ({ data: { question, source, id }, selectedPatient }) => {
  const [surveyResponseAnswer, setSurveyResponseAnswer] = useState();
  const { models } = useBackend();

  useEffect(() => {
    (async () => {
      const answer = await models.ReferralQuestion.getLatetSurveyAnswerForQuestion(selectedPatient.id, source);
      setSurveyResponseAnswer(answer ? answer.body : '');
    })();
  }, [selectedPatient.id, surveyResponseAnswer])

  return (
    <StyledView marginTop={10}>
      <Field
        component={TextField}
        name={id}
        label={question}
        value={surveyResponseAnswer || 'Answer not submitted'}
        disabled
      />
    </StyledView>
  )
}

export const SurveyAnswerField = compose(withPatient)(SurveyAnswerFieldComponent);
