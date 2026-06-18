import React, { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { List } from 'react-native-paper';
import { subject } from '@casl/ability';

import { DateFormats } from '../../../helpers/constants';
import { useBackendEffect } from '../../../hooks';
import { ErrorScreen } from '../../../components/ErrorScreen';
import { StyledScrollView } from '../../../styled/common';
import { theme } from '../../../styled/theme';
import { ReduxStoreProps } from '../../../interfaces/ReduxStoreProps';
import { PatientStateProps } from '../../../store/ducks/patient';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import { renderAnswer } from '../programs/SurveyResponseDetailsScreen';

const styles = StyleSheet.create({
  accordion: {
    paddingVertical: 16,
  },
  answerItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingLeft: 72,
  },
  question: {
    color: theme.colors.TEXT_SUPER_DARK,
    fontSize: 16,
  },
});

export const ReferralHistoryScreen = (): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );
  const isFocused = useIsFocused();
  const { ability } = useAuth();
  const { formatStringDate } = useDateFormatter();

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
              style={styles.accordion}
              title={`${survey.name} (${formatStringDate(startTime, DateFormats.DDMMYY)})`}
              left={(props): ReactElement => <List.Icon {...props} icon="clipboard-plus-outline" />}
            >
              {answers.map(answer => (
                <View key={answer.id} style={styles.answerItem}>
                  <Text style={styles.question}>{answer.dataElement.defaultText}</Text>
                  <View>
                    {renderAnswer({
                      type: answer.dataElement.type,
                      config: answer.dataElement.surveyScreenComponent.config,
                      answer: answer.body,
                    })}
                  </View>
                </View>
              ))}
            </List.Accordion>
          );
        })}
      </List.Section>
    </StyledScrollView>
  );
};
