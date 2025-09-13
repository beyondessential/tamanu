import React, { useEffect, useState } from 'react';

import { StyledView } from '/styled/common';
import { useFormikContext } from 'formik';
import { useBackend } from '~/ui/hooks';
import { renderAnswer } from '~/ui/navigation/screens/programs/SurveyResponseDetailsScreen';
import { Text } from 'react-native';

export const SurveyAnswerField = ({ patient, name, config }): JSX.Element => {
  const [answer, setAnswer] = useState<any>('');
  const [sourceQuestion, setSourceQuestion] = useState<any>();
  const { setFieldValue } = useFormikContext();
  const { models } = useBackend();

  useEffect(() => {
    (async (): Promise<void> => {
      const answer = await models.SurveyResponseAnswer.getLatestAnswerForPatient(
        patient.id,
        config.source || config.Source,
      );

      // Set the actual answer
      setFieldValue(name, answer?.body);

      if (answer) {
        const dataElement = await models.ProgramDataElement.findOne({
          where: { id: answer.dataElementId },
          relations: ['surveyScreenComponent', 'surveyScreenComponent.dataElement'],
        });

        setSourceQuestion(dataElement.surveyScreenComponent);
      }
      if (answer?.body) {
        setAnswer(answer?.body);
      }
    })();
  }, []);

  return (
    <StyledView alignItems="flex-start">
      {sourceQuestion ? (
        renderAnswer({
          type: sourceQuestion.dataElement.type,
          config: sourceQuestion.config,
          answer,
        })
      ) : (
        <Text>{answer}</Text>
      )}
    </StyledView>
  );
};
