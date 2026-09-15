import React, { useEffect } from 'react';

import { StyledView } from '/styled/common';
import { useFormikContext } from 'formik';
import { useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { renderAnswer } from '~/ui/navigation/screens/programs/SurveyResponseDetailsScreen';
import { resolveAnswerDisplayRecords } from '~/utils/resolveAnswerDisplayRecords';
import { Text } from 'react-native';

export const SurveyAnswerField = ({ patient, name, config }): JSX.Element => {
  const { setFieldValue } = useFormikContext();
  const source = config.source || config.Source;

  const { data } = useQuery({
    queryKey: patientKeys.lastAnswers(patient.id, { source }),
    queryFn: async () => {
      const { models } = Database;
      const answer = await models.SurveyResponseAnswer.getLatestAnswerForPatient(
        patient.id,
        source,
      );

      if (!answer) return { answer: null, sourceQuestion: null, answerDisplayRecords: null };

      const dataElement = await models.ProgramDataElement.findOne({
        where: { id: answer.dataElementId },
        relations: ['surveyScreenComponent', 'surveyScreenComponent.dataElement'],
      });
      const sourceQuestion = dataElement.surveyScreenComponent;

      const answerDisplayRecords = await resolveAnswerDisplayRecords(models, [
        {
          type: sourceQuestion.dataElement.type,
          config: sourceQuestion.config ?? null,
          answer: answer.body,
        },
      ]);

      return { answer, sourceQuestion, answerDisplayRecords };
    },
  });
  const answerBody = data?.answer?.body ?? '';
  const sourceQuestion = data?.sourceQuestion;

  useEffect(() => {
    if (data) setFieldValue(name, data.answer?.body);
  }, [data, name, setFieldValue]);

  return (
    <StyledView alignItems="flex-start">
      {sourceQuestion ? (
        renderAnswer({
          type: sourceQuestion.dataElement.type,
          config: sourceQuestion.config ?? null,
          answer: answerBody,
          answerDisplayRecords: data.answerDisplayRecords,
        })
      ) : (
        <Text>{answerBody}</Text>
      )}
    </StyledView>
  );
};
