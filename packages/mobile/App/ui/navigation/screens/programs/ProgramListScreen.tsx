import React, { useCallback, ReactElement } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FullView } from '/styled/common';
import { compose } from 'redux';
import { theme } from '/styled/theme';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { withPatient } from '/containers/Patient';
import { IPatient, SurveyTypes } from '~/types';
import { joinNames } from '/helpers/user';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { Survey } from '~/models/Survey';
import { useAuth } from '~/ui/contexts/AuthContext';

interface ProgramListScreenProps {
  selectedPatient: IPatient;
}

const Screen = ({ selectedPatient }: ProgramListScreenProps): ReactElement => {
  const navigation = useNavigation();
  const { ability } = useAuth();

  const [surveys, error] = useBackendEffect(({ models }) =>
    models.Survey.find({
      where: {
        surveyType: SurveyTypes.Programs,
      },
      order: {
        name: 'ASC',
      },
    }),
  );

  const filteredSurveys = surveys?.filter(survey => survey.shouldShowInList(ability));

  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const onNavigateToSurvey = (survey: Survey): void => {
    navigation.navigate(Routes.HomeStack.ProgramStack.ProgramTabs.Index, {
      surveyId: survey.id,
      surveyName: survey.name,
      surveyType: SurveyTypes.Programs,
    });
  };

  return (
    <FullView>
      <StackHeader title="Programs" subtitle={joinNames(selectedPatient)} onGoBack={goBack} />
      {error ? (
        <ErrorScreen error={error} />
      ) : (
        <FlatList
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.BACKGROUND_GREY,
            paddingTop: 5,
          }}
          showsVerticalScrollIndicator={false}
          data={filteredSurveys}
          keyExtractor={(item): string => item.id}
          renderItem={({ item }): ReactElement => (
            <MenuOptionButton
              key={item.id}
              title={item.name}
              onPress={(): void => onNavigateToSurveyList(item)}
              textProps={{ fontWeight: 400, color: theme.colors.TEXT_SUPER_DARK }}
              arrowForwardIconProps={{ size: 16, fill: theme.colors.TEXT_DARK }}
            />
          )}
          ItemSeparatorComponent={Separator}
        />
      )}
    </FullView>
  );
};

export const ProgramListScreen = compose(withPatient)(Screen);
