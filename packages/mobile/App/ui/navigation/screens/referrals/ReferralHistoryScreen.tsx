import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { List } from 'react-native-paper';
import { subject } from '@casl/ability';

import { FieldTypes } from '../../../helpers/fields';
import { formatStringDate } from '../../../helpers/date';
import { Routes } from '../../../helpers/routes';
import { DateFormats } from '../../../helpers/constants';
import { ISurveyResponse } from '../../../../types';
import { useBackendEffect } from '../../../hooks';
import { ErrorScreen } from '../../../components/ErrorScreen';
import { StyledScrollView, StyledText } from '../../../styled/common';
import { SurveyResponseLink } from '../../../components/SurveyResponseLink';
import { ReduxStoreProps } from '../../../interfaces/ReduxStoreProps';
import { PatientStateProps } from '../../../store/ducks/patient';
import { theme } from '../../../styled/theme';
import { getAutocompleteDisplayAnswer } from '../../../helpers/getAutocompleteDisplayAnswer';
import { useAuth } from '~/ui/contexts/AuthContext';

const AutocompleteAnswerDescription = ({ dataElement, body }) => {
  const [autocompleteAnswer, answerError] = useBackendEffect(
    async ({ models }): Promise<string | null> =>
      getAutocompleteDisplayAnswer(models, dataElement.id, body),
    [body, dataElement.id],
  );

  if (answerError) {
    return <StyledText color={theme.colors.ERROR}>Error: {answerError}</StyledText>;
  }

  return <StyledText color={theme.colors.TEXT_DARK}>{autocompleteAnswer}</StyledText>;
};

const SurveyLinkAnswerDescription = ({ dataElement, body }) => {
  const [programResponse, programResponseError] = useBackendEffect(
    async ({ models }): Promise<ISurveyResponse> => {
      if (dataElement.type !== FieldTypes.SURVEY_LINK) {
        return null;
      }
      return models.SurveyResponse.getFullResponse(body);
    },
    [body, dataElement.type],
  );

  if (programResponseError) {
    return <StyledText color={theme.colors.ERROR}>Error: {programResponseError}</StyledText>;
  }

  if (!programResponse) {
    return <StyledText color={theme.colors.TEXT_DARK}>{body}</StyledText>;
  }

  return (
    <SurveyResponseLink
      surveyResponse={programResponse}
      detailsRouteName={Routes.HomeStack.ReferralStack.ViewHistory.SurveyResponseDetailsScreen}
    />
  );
};

const AnswerDescription = ({ dataElement, body }) => {
  if (dataElement.type === FieldTypes.AUTOCOMPLETE) {
    return <AutocompleteAnswerDescription dataElement={dataElement} body={body} />;
  }

  if (dataElement.type === FieldTypes.SURVEY_LINK) {
    return <SurveyLinkAnswerDescription dataElement={dataElement} body={body} />;
  }

  if (dataElement.type === FieldTypes.MULTI_SELECT) {
    return <StyledText color={theme.colors.TEXT_DARK}>{JSON.parse(body).join(', ')}</StyledText>;
  }

  return <StyledText color={theme.colors.TEXT_DARK}>{body}</StyledText>;
};

export const ReferralHistoryScreen = (): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );
  const isFocused = useIsFocused();
  const { ability } = useAuth();

  const [referrals, error] = useBackendEffect(
    async ({ models }) => {
      const referrals = (await models.Referral.getForPatient(selectedPatient.id)) || [];
      return referrals.filter(referral =>
        ability.can('read', subject('Survey', { id: referral.surveyResponse.surveyId })),
      );
    },
    [isFocused],
  );

  if (error) {
    return <ErrorScreen error={error} />;
  }
  if (!referrals) {
    return null;
  }
  return (
    <StyledScrollView>
      <List.Section>
        {referrals.map(({ surveyResponse }) => {
          const { survey, answers, startTime } = surveyResponse;

          return (
            <List.Accordion
              key={`${survey.id}-${startTime}`}
              title={`${survey.name} (${formatStringDate(startTime, DateFormats.DDMMYY)})`}
              left={(props): ReactElement => <List.Icon {...props} icon="clipboard-plus-outline" />}
            >
              {answers.map(answer => (
                <List.Item
                  key={answer.id}
                  title={answer.dataElement.defaultText}
                  description={() => (
                    <AnswerDescription dataElement={answer.dataElement} body={answer.body} />
                  )}
                />
              ))}
            </List.Accordion>
          );
        })}
      </List.Section>
    </StyledScrollView>
  );
};
