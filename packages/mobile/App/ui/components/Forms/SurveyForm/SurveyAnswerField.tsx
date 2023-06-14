import React, { useEffect, useState } from 'react';

import { StyledView } from '/styled/common';
import { useFormikContext } from 'formik';
import { useBackend } from '~/ui/hooks';
import { Field } from '../FormField';
import { getAutocompleteDisplayAnswer } from '../../../helpers/getAutocompleteDisplayAnswer';
import { FieldTypes } from '../../../helpers/fields';
import { TextField } from '../../TextField/TextField';

export const SurveyAnswerField = ({
  patient,
  name,
  config,
  defaultText,
}): JSX.Element => {
  const [surveyResponseAnswer, setSurveyResponseAnswer] = useState<string>();
  const { setFieldValue } = useFormikContext();
  const { models } = useBackend();

  useEffect(() => {
    (async (): Promise<void> => {
      let displayAnswer;
      const answer = await models.SurveyResponseAnswer.getLatestAnswerForPatient(
        patient.id,
        config.source || config.Source,
      );

      // Set the actual answer
      setFieldValue(name, answer?.body);

      if (answer) {
        const dataElement = await models.ProgramDataElement.findOne({
          where: { id: answer.dataElementId },
        });

        if (dataElement.type === FieldTypes.AUTOCOMPLETE) {
          displayAnswer = await getAutocompleteDisplayAnswer(
            models,
            answer.dataElementId,
            answer.body,
          );
        }
      }

      // Set readable display answer
      setSurveyResponseAnswer(displayAnswer || answer?.body || '');
    })();
  }, [patient.id, surveyResponseAnswer, name, config.source, config.Source]);

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
  );
};
