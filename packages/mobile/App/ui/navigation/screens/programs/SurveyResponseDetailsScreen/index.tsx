import React, { useCallback } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { FullView } from '/styled/common';
import { StackHeader } from '/components/StackHeader';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '/helpers/date';
import { DateFormats, TimeFormats } from '/helpers/constants';
import { FieldTypes } from '/helpers/fields';

function getAnswerText(question, answer) {
  if(answer === null || answer === undefined) return "N/A";

  switch(question.type) {
    case FieldTypes.NUMBER:
    case FieldTypes.TEXT:
    case FieldTypes.MULTILINE:
    case FieldTypes.CALCULATED:
    case FieldTypes.SELECT:
    case FieldTypes.RESULT:
    case FieldTypes.RADIO:
      return answer || "N/A";
    case FieldTypes.BINARY:
      return answer ? "Yes" : "No";
    case FieldTypes.DATE:
      return formatDate(answer, DateFormats.DDMMYY);
    default:
      return "";
  }
}

const AnswerItem = ({ question, answer }) => (
  <StyledView height={40} marginLeft={10} justifyContent="center">
    <StyledText>{question.indicator}</StyledText>
    <StyledText>{getAnswerText(question, answer)}</StyledText>
  </StyledView>
);

export const SurveyResponseDetailsScreen = ({
  route
}) => {

  const navigation = useNavigation();
  const { surveyResponse } = route.params;
  const { program, answers, ...rest } = surveyResponse;
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const questionItems = program.questions
    .filter(q => q.indicator)
    .map(q => (
      <AnswerItem
        key={q.id}
        question={q}
        answer={answers[q.id]}
      />
    ));

  return (
    <FullView>
      <StackHeader
        subtitle={program.name}
        title={surveyResponse.name}
        onGoBack={goBack}
      />
      {questionItems}
    </FullView>
  );
}
