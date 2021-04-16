import React, { useCallback, ReactElement } from 'react';
import { Not } from "typeorm";
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
import { EncounterType, IPatient, SurveyTypes } from '~/types';
import { joinNames } from '/helpers/user';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';

interface ProgramListScreenProps {
  selectedPatient: IPatient;
}

const Screen = ({ selectedPatient }: ProgramListScreenProps): ReactElement => {
  const navigation = useNavigation();

  const [surveys, error] = useBackendEffect(({ models }) => models.Survey.find({
    surveyType: SurveyTypes.Programs,
  }));

  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const onNavigateToSurvey = (survey): any => {
    navigation.navigate(Routes.HomeStack.ProgramStack.ProgramTabs.Index, {
      surveyId: survey.id,
      surveyName: survey.name,
      surveyType: SurveyTypes.Programs,
    });
  };

  return (
    <FullView>
      <StackHeader
        title="Programs"
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      {error ? (
        <ErrorScreen error={error} />
      ) : (
        <FlatList
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.BACKGROUND_GREY,
          }}
          showsVerticalScrollIndicator={false}
          data={surveys && surveys.filter(x => x.programId !== 'program-hidden_forms')} // TODO: hack until we can delete surveys from server
          keyExtractor={(item): string => item.title}
          renderItem={({ item }): ReactElement => (
            <MenuOptionButton
              title={item.name}
              onPress={(): void => onNavigateToSurvey(item)}
              fontWeight={500}
              textColor={theme.colors.TEXT_SUPER_DARK}
            />
          )}
          ItemSeparatorComponent={Separator}
        />
      )}
    </FullView>
  );
};

export const ProgramListScreen = compose(withPatient)(Screen);
