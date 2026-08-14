import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { surveyKeys } from '~/ui/hooks/queries/queryKeys';
import { renderAnswer } from '../navigation/screens/programs/SurveyResponseDetailsScreen';
import { View, Text } from 'react-native';

export const SurveyAnswerResult = ({ config, answer }) => {
  const { data: sourceQuestion } = useQuery({
    queryKey: surveyKeys.dataElementByCode(config),
    queryFn: async () => {
      const parsedConfig = JSON.parse(config);
      const sourceDataElement = await Database.models.ProgramDataElement.findOne({
        where: { code: parsedConfig.source || parsedConfig.Source },
        relations: ['surveyScreenComponent', 'surveyScreenComponent.dataElement'],
      });
      return sourceDataElement.surveyScreenComponent;
    },
    enabled: !!(answer && config),
  });

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
