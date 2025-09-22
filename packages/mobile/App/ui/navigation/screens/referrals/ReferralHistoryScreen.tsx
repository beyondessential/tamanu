import React, { ReactElement, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { List } from 'react-native-paper';
import { subject } from '@casl/ability';

import { formatStringDate } from '../../../helpers/date';
import { DateFormats } from '../../../helpers/constants';
import { useBackendEffect } from '../../../hooks';
import { ErrorScreen } from '../../../components/ErrorScreen';
import { StyledScrollView, StyledText } from '../../../styled/common';
import { ReduxStoreProps } from '../../../interfaces/ReduxStoreProps';
import { PatientStateProps } from '../../../store/ducks/patient';
import { useAuth } from '~/ui/contexts/AuthContext';
import { renderAnswer } from '../programs/SurveyResponseDetailsScreen';

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
                  description={(): ReactNode => {
                    return (
                      <StyledText>
                        {renderAnswer({
                          type: answer.dataElement.type,
                          config: answer.dataElement.surveyScreenComponent.config,
                          answer: answer.body,
                        })}
                      </StyledText>
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
