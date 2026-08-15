import React, { ReactElement, useEffect } from 'react';
import { theme } from '/styled/theme';
import { FlatList } from 'react-native';
import { subject } from '@casl/ability';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { SurveyResponseScreenProps } from '../../../interfaces/Screens/ProgramsStack/SurveyResponseScreen';
import { Routes } from '../../../helpers/routes';
import { ErrorScreen } from '../../../components/ErrorScreen';
import { LoadingScreen } from '../../../components/LoadingScreen';
import { Separator } from '../../../components/Separator';
import { SurveyResponseLink } from '../../../components/SurveyResponseLink';

import { useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { StyledText } from '~/ui/styled/common';
import { SurveyTypes } from '~/types';
import { useAuth } from '~/ui/contexts/AuthContext';
import { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { PatientStateProps } from '~/ui/store/ducks/patient';
import { navigateAfterTimeout } from '~/ui/helpers/navigators';

export const ProgramViewHistoryScreen = ({ route }: SurveyResponseScreenProps): ReactElement => {
  const { latestResponseId } = route.params ?? {};
  const navigation = useNavigation();
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  const { ability, user } = useAuth();
  const isFocused = useIsFocused();

  const {
    data: responses,
    error,
    isPending: isLoading,
  } = useQuery({
    queryKey: [
      ...patientKeys.surveyResponses(selectedPatient.id),
      { type: SurveyTypes.Programs, latestResponseId, userId: user?.id },
    ],

    queryFn: async () => {
      const { models } = Database;
      const surveyResponses = await models.SurveyResponse.getForPatient({
        patientId: selectedPatient.id,
      });
      const surveys = await models.Survey.find({
        where: {
          surveyType: SurveyTypes.Programs,
        },
      });

      const surveyIds = surveys.map(survey => survey.id);

      return surveyResponses.filter(
        response =>
          ability.can('read', subject('Survey', { id: response.surveyId })) &&
          surveyIds.includes(response.surveyId),
      );
    },
  });

  useEffect(() => {
    if (!isFocused || isLoading || !responses) return;
    if (responses.length === 0) {
      navigateAfterTimeout(
        navigation,
        Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.AddDetails,
      );
    }
  }, [isFocused, responses, isLoading, navigation]);

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <FlatList
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.BACKGROUND_GREY,
      }}
      showsVerticalScrollIndicator={false}
      data={responses}
      keyExtractor={(item): string => item.id}
      renderItem={({ item }): ReactElement => (
        <SurveyResponseLink
          backgroundColor={theme.colors.BACKGROUND_GREY}
          surveyResponse={item}
          detailsRouteName={Routes.HomeStack.ProgramStack.SurveyResponseDetailsScreen}
        />
      )}
      ItemSeparatorComponent={() => <Separator paddingLeft="5%" width="95%" />}
      ListFooterComponent={(): ReactElement => {
        // responses only contain the latest 80 responses, exact 80 means there are more responses in the database, see SurveyResponse.getForPatient()
        if (responses.length === 80) {
          return (
            <StyledText paddingLeft={10}>
              Please view Tamanu Web for complete history of program form submissions.
            </StyledText>
          );
        }
        return <></>;
      }}
    />
  );
};
