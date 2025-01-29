import React, { ReactElement } from 'react';
import { theme } from '/styled/theme';
import { FlatList } from 'react-native';
import { subject } from '@casl/ability';

import { SurveyResponseScreenProps } from '../../../interfaces/Screens/ProgramsStack/SurveyResponseScreen';
import { Routes } from '../../../helpers/routes';
import { ErrorScreen } from '../../../components/ErrorScreen';
import { LoadingScreen } from '../../../components/LoadingScreen';
import { Separator } from '../../../components/Separator';
import { SurveyResponseLink } from '../../../components/SurveyResponseLink';

import { useBackendEffect } from '../../../hooks';
import { StyledText } from '~/ui/styled/common';
import { SurveyTypes } from '~/types';
import { useAuth } from '~/ui/contexts/AuthContext';

import { getConnection } from 'typeorm';
import RNFS from 'react-native-fs';

async function saveFile(content, fileName) {
  const path = `${RNFS.ExternalDirectoryPath}/${fileName}`;
  console.log('try nibba', path);
  RNFS.writeFile(path, content, 'utf8').then((success) => {
    console.log('FILE WRITTEN!');
  })
  .catch((err) => {
    console.log(err.message);
  });
}

export const ProgramViewHistoryScreen = ({
  route,
  navigation,
}: SurveyResponseScreenProps): ReactElement => {
  const { selectedPatient, latestResponseId } = route.params;

  const { ability } = useAuth();

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

      return surveyResponses.filter(
        response =>
          ability.can('read', subject('Survey', { id: response.surveyId })) &&
          surveyIds.includes(response.surveyId),
      );
    },
    [navigation.isFocused, latestResponseId],
  );

  const [test] = useBackendEffect(
    async ({ models }) => {
      console.log('here!');
      const connection = getConnection();
      const modelSummary = {};
      Object.entries(models).forEach(([modelName, model]) => {
        const metadata = connection.getMetadata(model);
        const fields = [];
        metadata.columns.forEach(col => {
          fields.push({ [col.propertyName]: col.type });
        });
        modelSummary[modelName] = fields;
      });
      await saveFile(JSON.stringify(modelSummary), 'models.txt');
      return null;
    },
    [],
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
