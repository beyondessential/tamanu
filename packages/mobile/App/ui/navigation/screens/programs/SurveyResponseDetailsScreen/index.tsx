import React, { type ReactElement } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { FullView, StyledText, StyledView } from '../../../../styled/common';
import { theme } from '../../../../styled/theme';

import type { ISurveyScreenComponent } from '~/types';
import { StackHeader } from '../../../../components/StackHeader';
import { formatPlainTime, formatStringDateForDisplay } from '../../../../helpers/date';
import { DateFormats } from '../../../../helpers/constants';
import {
  FieldTypes,
  getDisplayNameForModel,
  getPatientDataDisplayValue,
} from '../../../../helpers/fields';
import { SurveyResultBadge } from '../../../../components/SurveyResultBadge';
import { ViewPhotoLink } from '../../../../components/ViewPhotoLink';
import { LoadingScreen } from '../../../../components/LoadingScreen';
import { Database } from '~/infra/db';
import useFullSurveyResponseQuery from './useFullSurveyResponseQuery';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import { SurveyResponseLink } from '~/ui/components/SurveyResponseLink';
import { Routes } from '~/ui/helpers/routes';
import {
  getPatientDataTargetModelName,
  type AnswerDisplayRecords,
} from '~/utils/resolveAnswerDisplayRecords';

type RenderAnswerProps = {
  type: string;
  config: string | null;
  answer: string;
  answerDisplayRecords: AnswerDisplayRecords;
};

const parseConfig = (config: string | null): Record<string, any> => {
  if (!config) return {};
  try {
    return JSON.parse(config);
  } catch {
    return {};
  }
};

const SurveyLinkAnswer = ({ surveyResponse }): ReactElement => (
  <SurveyResponseLink
    surveyResponse={surveyResponse}
    detailsRouteName={Routes.HomeStack.ReferralStack.ViewHistory.SurveyResponseDetailsScreen}
  />
);

const AutocompleteAnswer = ({ modelName, record, answer }): ReactElement => {
  const { getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const { locale } = useDateFormatter();

  if (!record) {
    return <StyledText>{answer}</StyledText>;
  }

  const displayName = getDisplayNameForModel({
    modelName,
    record,
    getReferenceDataTranslation,
    getEnumTranslation,
    locale,
  });

  return <StyledText color={theme.colors.TEXT_DARK}>{displayName}</StyledText>;
};

const PatientDataAnswer = ({ column, record, targetModelName, answer }): ReactElement => {
  const { getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const { locale } = useDateFormatter();

  return (
    <StyledText>
      {getPatientDataDisplayValue({
        value: answer,
        column,
        record,
        targetModelName,
        getReferenceDataTranslation,
        getEnumTranslation,
        locale,
      })}
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
    <StyledText color={theme.colors.TEXT_DARK}>{getAnswerText(type, answer, locale)}</StyledText>
  );
};

/**
 * `answerDisplayRecords` holds every referenced record, resolved in one batch by the caller's
 * query. A lookup that misses means the record was deleted or has not synced yet, so the raw
 * answer is shown.
 */
export const renderAnswer = ({
  type,
  config,
  answer,
  answerDisplayRecords,
}: RenderAnswerProps): ReactElement => {
  if (!answer) return null;

  const { recordsByModelNameAndId, sourceQuestionsByDataElementCode, linkedSurveyResponsesById } =
    answerDisplayRecords;

  switch (type) {
    case FieldTypes.RESULT:
      return <SurveyResultBadge resultText={answer} />;
    case FieldTypes.PHOTO:
      return <ViewPhotoLink imageId={answer} />;
    case FieldTypes.PATIENT_DATA: {
      const { column } = parseConfig(config);
      const targetModelName = getPatientDataTargetModelName(Database.models, column);
      return (
        <PatientDataAnswer
          column={column}
          record={recordsByModelNameAndId[targetModelName]?.[answer]}
          targetModelName={targetModelName}
          answer={answer}
        />
      );
    }
    case FieldTypes.AUTOCOMPLETE: {
      const { source } = parseConfig(config);
      return (
        <AutocompleteAnswer
          modelName={source}
          record={recordsByModelNameAndId[source]?.[answer]}
          answer={answer}
        />
      );
    }
    case FieldTypes.SURVEY_ANSWER: {
      const { source, Source } = parseConfig(config);
      const sourceQuestion = sourceQuestionsByDataElementCode[source ?? Source];
      if (!sourceQuestion) return <StyledText>{answer}</StyledText>;
      return renderAnswer({
        type: sourceQuestion.dataElement.type,
        config: sourceQuestion.config ?? null,
        answer,
        answerDisplayRecords,
      });
    }
    case FieldTypes.SURVEY_LINK:
      return <SurveyLinkAnswer surveyResponse={linkedSurveyResponsesById[answer]} />;
    default:
      return <TextAnswer type={type} answer={answer} />;
  }
};

const AnswerItem = ({
  question,
  answer,
  answerDisplayRecords,
  index,
}: {
  question: ISurveyScreenComponent;
  answer: string | null;
  answerDisplayRecords: AnswerDisplayRecords;
  index: number;
}): ReactElement => (
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
          {renderAnswer({
            type: question.dataElement.type,
            config: question.config ?? null,
            answer,
            answerDisplayRecords,
          })}
        </StyledView>
      </>
    )}
  </StyledView>
);

export const SurveyResponseDetailsScreen = ({ route }): ReactElement => {
  const navigation = useNavigation();
  const { surveyResponseId } = route.params;

  const { data: surveyResponse, error } = useFullSurveyResponseQuery(surveyResponseId);

  if (error) {
    console.error(error);
    return <StyledText>{error.message}</StyledText>;
  }

  if (!surveyResponse) {
    return <LoadingScreen />;
  }

  const { encounter, survey, answeredQuestions, answerDisplayRecords } = surveyResponse;
  const { patient } = encounter;

  return (
    <FullView>
      <StackHeader
        subtitle={survey.name}
        title={`${patient.firstName} ${patient.lastName}`}
        onGoBack={navigation.goBack}
      />
      <ScrollView>
        {answeredQuestions.map(({ question, answer }, index) => (
          <AnswerItem
            key={question.id}
            index={index}
            question={question}
            answer={answer}
            answerDisplayRecords={answerDisplayRecords}
          />
        ))}
      </ScrollView>
    </FullView>
  );
};
