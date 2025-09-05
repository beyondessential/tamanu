import React, { useEffect, useState } from 'react';
import { useBackend } from '../hooks';
import { renderAnswer } from '../navigation/screens/programs/SurveyResponseDetailsScreen';
import { View, Text } from 'react-native';

export const SurveyAnswerResult = ({ config, answer }) => {
  const { models } = useBackend();

  const [sourceQuestion, setSourceQuestion] = useState<any>();

  useEffect(() => {
    (async (): Promise<void> => {
      if (answer && config) {
        const parsedConfig = JSON.parse(config);
        const sourceDataElement = await models.ProgramDataElement.findOne({
          where: { code: parsedConfig.source || parsedConfig.Source },
          relations: ['surveyScreenComponent', 'surveyScreenComponent.dataElement'],
        });

        setSourceQuestion(sourceDataElement.surveyScreenComponent);
      }
    })();
  }, []);

  return (
    <View>
      {sourceQuestion ? (
        renderAnswer({
          type: sourceQuestion.dataElement.type,
          config: sourceQuestion.config,
          answer,
        })
      ) : (
        <Text>{answer}</Text>
      )}
    </View>
  );
};
