import React, { useCallback } from 'react';
import { StyledView, StyledText, FullView } from '/styled/common';
import { theme } from '/styled/theme';

import { StackHeader } from '/components/StackHeader';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '/helpers/date';
import { DateFormats, TimeFormats } from '/helpers/constants';
import { FieldTypes } from '/helpers/fields';

function getAnswerText(question, answer) {
  if (answer === null || answer === undefined) return 'N/A';

  switch (question.type) {
    case FieldTypes.NUMBER:
    case FieldTypes.TEXT:
    case FieldTypes.MULTILINE:
    case FieldTypes.CALCULATED:
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

const AnswerItem = ({ question, answer, index, answersLength }) => (
  <StyledView
    height={40}
    justifyContent="space-between"
    flexDirection="row"
    alignItems="center"
    paddingLeft={16}
    paddingRight={16}
    background={index % 2 ? theme.colors.WHITE : theme.colors.BACKGROUND_GREY}
    borderTopWidth={index === answersLength - 2 ? 1 : 0}>
    <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
      {question.indicator}
    </StyledText>
    <StyledText>{getAnswerText(question, answer)}</StyledText>
  </StyledView>
);

export const SurveyResponseDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { surveyResponse } = route.params;
  const { patient, program, answers, ...rest } = surveyResponse;
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const questionItems = program.questions
    .filter(q => q.indicator)
    .map((q, i, array) => (
      <AnswerItem
        index={i}
        answersLength={array.length}
        key={q.id}
        question={q}
        answer={answers[q.id]}
      />
    ));

  return (
    <FullView>
      <StackHeader
        subtitle={program.name}
        title={`${patient.firstName} ${patient.lastName}`}
        onGoBack={goBack}
      />
      {questionItems}
    </FullView>
  );
};
