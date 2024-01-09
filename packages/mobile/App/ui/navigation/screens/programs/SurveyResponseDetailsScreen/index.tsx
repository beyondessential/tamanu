import React, { useCallback, ReactElement } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

import { StyledView, StyledText, FullView } from '../../../../styled/common';
import { theme } from '../../../../styled/theme';

import { StackHeader } from '../../../../components/StackHeader';
import { formatStringDate } from '../../../../helpers/date';
import { AutocompleteSourceToColumnMap, DateFormats } from '../../../../helpers/constants';
import { FieldTypes } from '../../../../helpers/fields';
import { SurveyResultBadge } from '../../../../components/SurveyResultBadge';
import { ViewPhotoLink } from '../../../../components/ViewPhotoLink';
import { LoadingScreen } from '../../../../components/LoadingScreen';
import { useBackendEffect } from '../../../../hooks';

const AutocompleteAnswer = ({ question, answer }): ReactElement => {
  const config = JSON.parse(question.config);
  const columnName = AutocompleteSourceToColumnMap[config.source];
  const [refData, error] = useBackendEffect(
    ({ models }) => models[config.source].getRepository().findOne(answer),
    [question],
  );
  if (!refData) {
    return null;
  }
  if (error) {
    console.error(error);
    return <StyledText>{error.message}</StyledText>;
  }
  return (
    <StyledText textAlign="right" color={theme.colors.TEXT_DARK}>
      {refData[columnName]}
    </StyledText>
  );
};

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
    case FieldTypes.USER_DATA:
    case FieldTypes.PATIENT_DATA:
      return answer || 'N/A';
    case FieldTypes.BINARY:
    case FieldTypes.CHECKBOX:
      return answer.toLowerCase() === 'yes' ? 'Yes' : 'No';
    case FieldTypes.DATE:
    case FieldTypes.SUBMISSION_DATE:
      return formatStringDate(answer, DateFormats.DDMMYY);
    case FieldTypes.PATIENT_ISSUE_GENERATOR:
      return 'PATIENT_ISSUE_GENERATOR';
    case FieldTypes.MULTI_SELECT:
      return JSON.parse(answer).join(', ');
    default:
      console.warn(`Unknown field type: ${question.dataElement.type}`);
      return `?? ${question.dataElement.type}`;
  }
}

const renderAnswer = (question, answer): ReactElement => {
  switch (question.dataElement.type) {
    case FieldTypes.RESULT:
      return <SurveyResultBadge resultText={answer} />;
    case FieldTypes.PHOTO:
      return <ViewPhotoLink imageId={answer} />;
    case FieldTypes.AUTOCOMPLETE:
      return <AutocompleteAnswer question={question} answer={answer} />;
    default:
      return (
        <StyledText textAlign="right" color={theme.colors.TEXT_DARK}>
          {getAnswerText(question, answer)}
        </StyledText>
      );
  }
};

const AnswerItem = ({ question, answer, index }): ReactElement => (
  <StyledView
    minHeight={40}
    maxWidth="100%"
    justifyContent="space-between"
    flexDirection="row"
    flexGrow={1}
    alignItems="center"
    paddingLeft={16}
    paddingRight={16}
    background={index % 2 ? theme.colors.WHITE : theme.colors.BACKGROUND_GREY}
  >
    <StyledView maxWidth="40%">
      <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
        {question.dataElement.name}
      </StyledText>
    </StyledView>
    <StyledView alignItems="flex-end" justifyContent="center" maxWidth="60%">
      {renderAnswer(question, answer)}
    </StyledView>
  </StyledView>
);

export const SurveyResponseDetailsScreen = ({ route }): ReactElement => {
  const navigation = useNavigation();
  const { surveyResponseId } = route.params;

  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const [surveyResponse, error] = useBackendEffect(
    ({ models }) => models.SurveyResponse.getFullResponse(surveyResponseId),
    [surveyResponseId],
  );

  if (error) {
    console.error(error);
    return <StyledText>{error}</StyledText>;
  }

  if (!surveyResponse) {
    return <LoadingScreen />;
  }

  const { encounter, survey, questions, answers } = surveyResponse;
  const { patient } = encounter;

  const attachAnswer = (q): { answer: string; question: any } | null => {
    const answerObject = answers.find(a => a.dataElement.id === q.dataElement.id);
    return {
      question: q,
      answer: (answerObject || null) && answerObject.body,
    };
  };

  const questionToAnswerItem = ({ question, answer }, i): ReactElement => (
    <AnswerItem key={question.id} index={i} question={question} answer={answer} />
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
      <ScrollView>{answerItems}</ScrollView>
    </FullView>
  );
};
