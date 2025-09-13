import React, { useEffect, useState } from 'react';
import { useBackend } from '../hooks';
import { renderAnswer } from '../navigation/screens/programs/SurveyResponseDetailsScreen';
import { View, Text } from 'react-native';

export const SurveyAnswerResult = ({ question, answer }) => {
  const { models } = useBackend();

  const [sourceQuestion, setSourceQuestion] = useState<any>();

  useEffect(() => {
    (async (): Promise<void> => {
      if (answer && question.config) {
        const config = JSON.parse(question.config);
        const sourceDataElement = await models.ProgramDataElement.findOne({
          where: { code: config.source || config.Source },
          relations: ['surveyScreenComponent', 'surveyScreenComponent.dataElement'],
        });

        setSourceQuestion(sourceDataElement.surveyScreenComponent);
      }
    })();
  }, [answer, models.ProgramDataElement, question.config]);

  return (
    <View>{sourceQuestion ? renderAnswer(sourceQuestion, answer) : <Text>{answer}</Text>}</View>
  );
};
