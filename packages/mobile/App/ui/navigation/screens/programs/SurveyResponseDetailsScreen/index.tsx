import React, { ReactElement, useCallback } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { FullView, StyledText, StyledView } from '../../../../styled/common';
import { theme } from '../../../../styled/theme';

import type { ISurveyScreenComponent } from '~/types';
import { StackHeader } from '../../../../components/StackHeader';
import { formatPlainTime, formatStringDateForDisplay } from '../../../../helpers/date';
import { DateFormats } from '../../../../helpers/constants';
import { FieldTypes, getDisplayNameForModel } from '../../../../helpers/fields';
import { SurveyResultBadge } from '../../../../components/SurveyResultBadge';
import { SurveyAnswerResult } from '../../../../components/SurveyAnswerResult';
import { ViewPhotoLink } from '../../../../components/ViewPhotoLink';
import { LoadingScreen } from '../../../../components/LoadingScreen';
import { useBackendEffect } from '../../../../hooks';
import { PatientDataDisplayField } from '~/ui/components/PatientDataDisplayField/PatientDataDisplayField';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import { SurveyResponseLink } from '~/ui/components/SurveyResponseLink';
import { Routes } from '~/ui/helpers/routes';

const SurveyLinkAnswer = ({ answer }): ReactElement => {
  const [surveyResponse, error] = useBackendEffect(
    async ({ models }) => {
      return models.SurveyResponse.getFullResponse(answer);
    },
    [answer],
  );
  if (error) {
    return <StyledText>{error.message}</StyledText>;
  }
  return (
    <SurveyResponseLink
      surveyResponse={surveyResponse}
      detailsRouteName={Routes.HomeStack.ReferralStack.ViewHistory.SurveyResponseDetailsScreen}
    />
  );
};

const AutocompleteAnswer = ({ config, answer }): ReactElement => {
  const { getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const { locale } = useDateFormatter();
  const parsedConfig = JSON.parse(config);
  const [record, error] = useBackendEffect(
    ({ models }) => models[parsedConfig.source].getRepository().findOne({ where: { id: answer } }),
    [config, answer],
  );
  if (!record) {
    return <StyledText>{answer}</StyledText>;
  }
  if (error) {
    console.error(error);
    return <StyledText>{error.message}</StyledText>;
  }
  const displayName = getDisplayNameForModel({
    modelName: parsedConfig.source,
    record: record,
    getReferenceDataTranslation,
    getEnumTranslation,
    locale,
  });

  return (
    <StyledText color={theme.colors.TEXT_DARK}>
      {displayName}
    </StyledText>
  );
};

function getAnswerText(type, answer, locale?: string): string | number {
  if (answer === null || answer === undefined) return 'N/A';

  switch (type) {
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
      return answer || 'N/A';
    case FieldTypes.BINARY:
    case FieldTypes.CHECKBOX:
      return answer.toLowerCase() === 'yes' ? 'Yes' : 'No';
    case FieldTypes.DATE:
    case FieldTypes.SUBMISSION_DATE:
      return formatStringDateForDisplay(answer, DateFormats.DDMMYY, locale);
    case FieldTypes.DATE_TIME:
      return formatStringDateForDisplay(answer, DateFormats.DDMMYY_HHMMSS, locale);
    case FieldTypes.TIME:
      return formatPlainTime(answer);
    case FieldTypes.PATIENT_ISSUE_GENERATOR:
      return 'PATIENT_ISSUE_GENERATOR';
    case FieldTypes.MULTI_SELECT:
      return JSON.parse(answer).join(', ');
    case FieldTypes.GEOLOCATE:
      return answer || 'N/A';
    default:
      console.warn(`Unknown field type: ${type}`);
      return `?? ${type}`;
  }
}

const TextAnswer = ({ type, answer }): ReactElement => {
  const { locale } = useDateFormatter();
  return (
    <StyledText color={theme.colors.TEXT_DARK}>
      {getAnswerText(type, answer, locale)}
    </StyledText>
  );
};

export const renderAnswer = ({ type, config, answer }): ReactElement => {
  if (!answer) return answer;

  switch (type) {
    case FieldTypes.RESULT:
      return <SurveyResultBadge resultText={answer} />;
    case FieldTypes.PHOTO:
      return <ViewPhotoLink imageId={answer} />;
    case FieldTypes.PATIENT_DATA:
      return <PatientDataDisplayField value={answer} config={JSON.parse(config)} />;
    case FieldTypes.AUTOCOMPLETE:
      return <AutocompleteAnswer config={config} answer={answer} />;
    case FieldTypes.SURVEY_ANSWER:
      return <SurveyAnswerResult config={config} answer={answer} />;
    case FieldTypes.SURVEY_LINK:
      return <SurveyLinkAnswer answer={answer} />;
    default:
      return <TextAnswer type={type} answer={answer} />;
  }
};

const AnswerItem = ({ question, answer, index }): ReactElement => (
  <StyledView
    minHeight={40}
    maxWidth="100%"
    flexDirection="column"
    flexGrow={1}
    alignItems="flex-start"
    paddingHorizontal={16}
    paddingVertical={8}
    background={index % 2 ? theme.colors.WHITE : theme.colors.BACKGROUND_GREY}
  >
    {question.dataElement.type === FieldTypes.DISPLAY_TEXT ? (
      <StyledView width="100%">
        <StyledText fontWeight="bold" fontSize={16} color={theme.colors.TEXT_DARK}>
          {question.dataElement.name}
        </StyledText>
        <StyledText color={theme.colors.TEXT_DARK}>{question.dataElement.defaultText}</StyledText>
        <StyledText color={theme.colors.TEXT_MID}>{question.detail}</StyledText>
      </StyledView>
    ) : (
      <>
        <StyledText fontWeight="bold" fontSize={16} color={theme.colors.TEXT_DARK}>
          {question.dataElement.name}
        </StyledText>
        <StyledView alignItems="flex-start" width="100%" marginTop={4}>
          {renderAnswer({ type: question.dataElement.type, config: question.config, answer })}
        </StyledView>
      </>
    )}
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

  const answersByDataElementId = new Map(answers.map(a => [a.dataElement.id, a.body] as const));
  const attachAnswer = <T extends ISurveyScreenComponent>(
    q: T,
  ): { answer: string | null; question: T } => {
    return {
      question: q,
      answer: answersByDataElementId.get(q.dataElement.id) ?? null,
    };
  };

  const questionToAnswerItem = ({
    question,
    answer,
  }: {
    answer: string | null;
    question: ISurveyScreenComponent;
  }): ReactElement => (
    <AnswerItem
      key={question.id}
      index={question.dataElement.id}
      question={question}
      answer={answer}
    />
  );

  const answerItems = questions
    .filter(q => q.dataElement.name)
    .map(attachAnswer)
    .filter(
      q =>
        (q.answer != null && q.answer !== '') ||
        q.question.dataElement.type === FieldTypes.DISPLAY_TEXT,
    )
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
