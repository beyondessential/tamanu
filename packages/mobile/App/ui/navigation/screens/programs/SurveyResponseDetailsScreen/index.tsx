import React, { useCallback } from 'react';
import { StyledView, StyledText, FullView } from '/styled/common';
import { theme } from '/styled/theme';

import { ScrollView } from 'react-native-gesture-handler';
import { StackHeader } from '/components/StackHeader';
import { useNavigation } from '@react-navigation/native';
import { formatStringDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldTypes } from '/helpers/fields';
import { SurveyResultBadge } from '/components/SurveyResultBadge';

import { LoadingScreen } from '~/ui/components/LoadingScreen';
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
    case FieldTypes.CONDITION:
      return answer || 'N/A';
    case FieldTypes.BINARY:
    case FieldTypes.CHECKBOX:
      return (answer.toLowerCase() === 'yes') ? 'Yes' : 'No';
    case FieldTypes.DATE:
    case FieldTypes.SUBMISSION_DATE:
      return formatStringDate(answer, DateFormats.DDMMYY);
    default:
      console.warn(`Unknown field type: ${question.dataElement.type}`);
      return `?? ${question.dataElement.type}`;
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
    minHeight={40}
    justifyContent="space-between"
    flexDirection="row"
    alignItems="center"
    paddingLeft={16}
    paddingRight={16}
    background={index % 2 ? theme.colors.WHITE : theme.colors.BACKGROUND_GREY}
  >
    <StyledView maxWidth={'80%'}>
      <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
        {question.dataElement.name}
      </StyledText>
    </StyledView>
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
    return <LoadingScreen />;
  }

  const { encounter, survey, questions, answers, ...rest } = surveyResponse;
  const { patient } = encounter;

  const attachAnswer = (q): string | null => {
    const answerObject = answers.find(a => a.dataElement.id === q.dataElement.id);
    return {
      question: q,
      answer: (answerObject || null) && answerObject.body,
    }
  }

  const questionToAnswerItem = ({ question, answer }, i): JSX.Element => (
    <AnswerItem 
      key={question.id} 
      index={i}
      question={question}
      answer={answer}
    />
  );

  const answerItems = questions
    .filter(q => q.dataElement.name)
    .map(attachAnswer)
    .filter(q => q.answer !== null && q.answer !== '')
    .map(questionToAnswerItem);

  return (
    <FullView>
      <StackHeader
        subtitle={survey.name}
        title={`${patient.firstName} ${patient.lastName}`}
        onGoBack={goBack}
      />
      <ScrollView>
        {answerItems}
      </ScrollView>
    </FullView>
  );
};
