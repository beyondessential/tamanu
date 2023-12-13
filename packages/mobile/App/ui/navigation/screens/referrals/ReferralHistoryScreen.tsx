import { useIsFocused } from '@react-navigation/native';
import React, { ReactElement, ReactNode } from 'react';
import { List } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { ISurveyResponse } from '../../../../types';
import { ErrorScreen } from '../../../components/ErrorScreen';
import { SurveyResponseLink } from '../../../components/SurveyResponseLink';
import { DateFormats } from '../../../helpers/constants';
import { formatStringDate } from '../../../helpers/date';
import { FieldTypes } from '../../../helpers/fields';
import { getAutocompleteDisplayAnswer } from '../../../helpers/getAutocompleteDisplayAnswer';
import { Routes } from '../../../helpers/routes';
import { useBackendEffect } from '../../../hooks';
import { ReduxStoreProps } from '../../../interfaces/ReduxStoreProps';
import { PatientStateProps } from '../../../store/ducks/patient';
import { StyledScrollView, StyledText } from '../../../styled/common';
import { theme } from '../../../styled/theme';

export const ReferralHistoryScreen = (): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );
  const isFocused = useIsFocused();
  const [referrals, error] = useBackendEffect(
    ({ models }) => models.Referral.getForPatient(selectedPatient.id),
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
                  description={(): ReactNode => {
                    const { dataElement, body } = answer;
                    if (dataElement.type === FieldTypes.AUTOCOMPLETE) {
                      const [autocompleteAnswer, answerError] = useBackendEffect(
                        async ({ models }): Promise<string | null> =>
                          getAutocompleteDisplayAnswer(models, dataElement.id, body),
                        [body],
                      );

                      if (answerError) {
                        return (
                          <StyledText color={theme.colors.ERROR}>Error: {answerError}</StyledText>
                        );
                      }

                      return (
                        <StyledText color={theme.colors.TEXT_DARK}>{autocompleteAnswer}</StyledText>
                      );
                    }
                    const [programResponse, programResponseError] = useBackendEffect(
                      async ({ models }): Promise<ISurveyResponse> => {
                        if (dataElement.type !== FieldTypes.SURVEY_LINK) {
                          return null;
                        }
                        return models.SurveyResponse.getFullResponse(body);
                      },
                      [body],
                    );
                    if (dataElement.type === FieldTypes.MULTI_SELECT) {
                      return (
                        <StyledText color={theme.colors.TEXT_DARK}>
                          {JSON.parse(body).join(', ')}
                        </StyledText>
                      );
                    }
                    if (dataElement.type !== FieldTypes.SURVEY_LINK) {
                      return <StyledText color={theme.colors.TEXT_DARK}>{body}</StyledText>;
                    }
                    if (programResponseError) {
                      throw programResponseError;
                    }
                    return (
                      <SurveyResponseLink
                        surveyResponse={programResponse}
                        detailsRouteName={Routes.HomeStack.ReferralStack.ViewHistory
                          .SurveyResponseDetailsScreen}
                      />
                    );
                  }}
                />
              ))}
            </List.Accordion>
          );
        })}
      </List.Section>
    </StyledScrollView>
  );
};
