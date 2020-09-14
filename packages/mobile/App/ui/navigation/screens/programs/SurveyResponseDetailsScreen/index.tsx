import React, { useCallback } from 'react';
import { StyledView, StyledText, FullView } from '/styled/common';
import { theme } from '/styled/theme';

import { StackHeader } from '/components/StackHeader';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldTypes } from '/helpers/fields';
import { SurveyResultBadge } from '/components/SurveyResultBadge';

function getAnswerText(question, answer): string | number {
  if (answer === null || answer === undefined) return 'N/A';

  switch (question.type) {
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
      return formatDate(answer, DateFormats.DDMMYY);
    default:
      return '';
  }
}

const isCalculated = (question): JSX.Element => question.type === FieldTypes.CALCULATED
  || question.type === FieldTypes.RESULT;

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
      {question.indicator}
    </StyledText>
    {question.type === FieldTypes.RESULT ? (
      <SurveyResultBadge result={answer} />
    ) : (
        <StyledText>{getAnswerText(question, answer)}</StyledText>
      )}
  </StyledView>
);

export const SurveyResponseDetailsScreen = ({ route }): JSX.Element => {
  const navigation = useNavigation();
  const { surveyResponse } = route.params;
  const { patient, program, answers, ...rest } = surveyResponse;
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const questionToAnswerItem = (q, i): JSX.Element => (
    <AnswerItem index={i} key={q.id} question={q} answer={answers[q.id]} />
  );

  const basicAnswerItems = program.questions
    .filter(q => q.indicator)
    .filter(q => !isCalculated(q))
    .map(questionToAnswerItem);

  const calculatedAnswerItems = program.questions
    .filter(q => q.indicator)
    .filter(q => isCalculated(q))
    .map(questionToAnswerItem);

  return (
    <FullView>
      <StackHeader
        subtitle={program.name}
        title={`${patient.firstName} ${patient.lastName}`}
        onGoBack={goBack}
      />
      {basicAnswerItems}
      <StyledView borderTopWidth={1} height={1} />
      {calculatedAnswerItems}
    </FullView>
  );
};
