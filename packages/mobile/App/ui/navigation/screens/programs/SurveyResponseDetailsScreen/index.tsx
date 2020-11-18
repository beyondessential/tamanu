import React, { useCallback } from 'react';
import { StyledView, StyledText, FullView } from '/styled/common';
import { theme } from '/styled/theme';

import { ScrollView } from 'react-native-gesture-handler';
import { StackHeader } from '/components/StackHeader';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldTypes } from '/helpers/fields';
import { SurveyResultBadge } from '/components/SurveyResultBadge';

import { useBackendEffect } from '~/ui/hooks';

function getAnswerText(question, answer): string | number {
  if (answer === null || answer === undefined) return 'N/A';

  switch (question.dataElement.type) {
    case FieldTypes.NUMBER:
    case FieldTypes.MULTILINE:
      return answer;
    case FieldTypes.CALCULATED:
      return typeof answer === 'number' ? answer.toFixed(1) : answer;
    case FieldTypes.TEXT:
    case FieldTypes.SELECT:
    case FieldTypes.RESULT:
    case FieldTypes.RADIO:
      return answer || 'N/A';
    case FieldTypes.BINARY:
      return answer ? 'Yes' : 'No';
    case FieldTypes.DATE:
      return `date: ${answer}`; //formatDate(answer, DateFormats.DDMMYY);
    default:
      return '';
  }
}

const isCalculated = (question): JSX.Element => {
  const questionType = question.dataElement.type;
  switch(question.dataElement.type) {
    case FieldTypes.CALCULATED:
    case FieldTypes.RESULT:
      return true;
    default:
      return false;
  }
};

const AnswerItem = ({ question, answer, index }): JSX.Element => (
  <StyledView
    height={40}
    justifyContent="space-between"
    flexDirection="row"
    alignItems="center"
    paddingLeft={16}
    paddingRight={16}
    background={index % 2 ? theme.colors.WHITE : theme.colors.BACKGROUND_GREY}
  >
    <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
      {question.dataElement.indicator}
    </StyledText>
    {question.dataElement.type === FieldTypes.RESULT ? (
      <SurveyResultBadge result={answer} />
    ) : (
      <StyledText>{getAnswerText(question, answer)}</StyledText>
    )}
  </StyledView>
);

export const SurveyResponseDetailsScreen = ({ route }): JSX.Element => {
  const navigation = useNavigation();
  const { surveyResponseId } = route.params;

  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const [surveyResponse, error] = useBackendEffect(
    ({ models }) => models.SurveyResponse.getFullResponse(surveyResponseId),
    [surveyResponseId]
  );

  if(error) {
    console.error(error);
    return <StyledText>{error}</StyledText>;
  }

  if(!surveyResponse) {
    return <StyledText>Loading</StyledText>;
  }

  const { encounter, survey, questions, answers, ...rest } = surveyResponse;
  const { patient } = encounter;

  const getAnswerForQuestion = (q) => {
    const answerObject = answers.find(a => a.dataElement.id === q.dataElement.id);
    if(!answerObject) return '';
    return answerObject.body;
  }
    
  const questionToAnswerItem = (q, i): JSX.Element => (
    <AnswerItem index={i} key={q.id} question={q} answer={getAnswerForQuestion(q)} />
  );

  const basicAnswerItems = questions
    .filter(q => q.dataElement.indicator)
    .filter(q => !isCalculated(q))
    .map(questionToAnswerItem);

  const calculatedAnswerItems = questions
    .filter(q => q.dataElement.indicator)
    .filter(q => isCalculated(q))
    .map(questionToAnswerItem);

  return (
    <FullView>
      <StackHeader
        subtitle={survey.name}
        title={`${patient.firstName} ${patient.lastName}`}
        onGoBack={goBack}
      />
      <ScrollView>
        {calculatedAnswerItems}
        <StyledView borderTopWidth={1} height={1} />
        {basicAnswerItems}
      </ScrollView>
    </FullView>
  );
};
