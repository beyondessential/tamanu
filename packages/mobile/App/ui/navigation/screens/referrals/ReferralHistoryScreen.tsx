import React, { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { List } from 'react-native-paper';
import { subject } from '@casl/ability';
import { useQuery } from '@tanstack/react-query';

import { DateFormats } from '../../../helpers/constants';
import { Database } from '~/infra/db';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { ErrorScreen } from '../../../components/ErrorScreen';
import { StyledScrollView } from '../../../styled/common';
import { theme } from '../../../styled/theme';
import type { ReduxStoreProps } from '../../../interfaces/ReduxStoreProps';
import type { PatientStateProps } from '../../../store/ducks/patient';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import { renderAnswer } from '../programs/SurveyResponseDetailsScreen';
import { resolveAnswerDisplayRecords } from '~/utils/resolveAnswerDisplayRecords';

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
  const { ability, user } = useAuth();
  const { formatStringDate } = useDateFormatter();

  const { data, error } = useQuery({
    queryKey: [...patientKeys.referrals(selectedPatient.id), { userId: user?.id }],
    queryFn: async () => {
      const allReferrals = await Database.models.Referral.getForPatient(selectedPatient.id);
      const referrals =
        allReferrals?.filter(referral =>
          ability.can('read', subject('Survey', { id: referral.surveyResponse.surveyId })),
        ) ?? [];

      // Resolve every answer's referenced record up front, so rendering costs no further queries.
      const answersToDisplay = referrals.flatMap(({ surveyResponse }) =>
        surveyResponse.answers.map(answer => ({
          type: answer.dataElement.type,
          config: answer.dataElement.surveyScreenComponent.config ?? null,
          answer: answer.body,
        })),
      );

      return {
        referrals,
        answerDisplayRecords: await resolveAnswerDisplayRecords(Database.models, answersToDisplay),
      };
    },
  });

  if (error) {
    return <ErrorScreen error={error} />;
  }
  if (!data) {
    return null;
  }

  const { referrals, answerDisplayRecords } = data;
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
                      config: answer.dataElement.surveyScreenComponent.config ?? null,
                      answer: answer.body,
                      answerDisplayRecords,
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
