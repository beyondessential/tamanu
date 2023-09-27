import React, { ReactElement } from 'react';
import { theme } from '/styled/theme';
import { FlatList } from 'react-native';

import { SurveyResponseScreenProps } from '../../../interfaces/Screens/ProgramsStack/SurveyResponseScreen';
import { Routes } from '../../../helpers/routes';
import { ErrorScreen } from '../../../components/ErrorScreen';
import { LoadingScreen } from '../../../components/LoadingScreen';
import { Separator } from '../../../components/Separator';
import { SurveyResponseLink } from '../../../components/SurveyResponseLink';

import { useBackendEffect } from '../../../hooks';
import { StyledText } from '~/ui/styled/common';
import { SurveyTypes } from '~/types';

export const ProgramViewHistoryScreen = ({
  route,
  navigation,
}: SurveyResponseScreenProps): ReactElement => {
  const { selectedPatient, latestResponseId } = route.params;

  // use latestResponseId to ensure that we refresh when
  // a new survey is submitted (as this tab can be mounted while
  // it isn't active)
  const [responses, error] = useBackendEffect(
    async ({ models }) => {
      if (!navigation.isFocused) {
        // always show the loading screen when in background
        // (ie, it will be what's shown when the user navigates
        // to this tab). We don't want to load & render all the
        // responses as it causes performance issues.
        return null;
      }

      const surveyResponses = await models.SurveyResponse.getForPatient(selectedPatient.id);
      const surveys = await models.Survey.find({
        where: {
          surveyType: SurveyTypes.Programs,
        },
      });

      const surveyIds = surveys.map(survey => survey.id);

      return surveyResponses.filter(response => surveyIds.includes(response.surveyId));
    },
    [navigation.isFocused, latestResponseId],
  );

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!responses) {
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
        if (responses.length > 80) {
          return (
            <StyledText paddingLeft={10}>
              Pease view Tamanu Desktop for complete history of program form submissions.
            </StyledText>
          );
        }
        return <></>;
      }}
    />
  );
};
