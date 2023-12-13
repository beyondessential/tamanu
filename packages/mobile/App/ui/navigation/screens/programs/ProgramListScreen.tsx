import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { withPatient } from '/containers/Patient';
import { Routes } from '/helpers/routes';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { useNavigation } from '@react-navigation/native';
import React, { ReactElement } from 'react';
import { FlatList } from 'react-native';
import { compose } from 'redux';
import { In } from 'typeorm/browser';
import { Program } from '~/models/Program';
import { SurveyTypes } from '~/types';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { useBackendEffect } from '~/ui/hooks';

const Screen = (): ReactElement => {
  const navigation = useNavigation();

  const [programs, programsError, programsIsLoading] = useBackendEffect(async ({ models }) => {
    const surveys = await models.Survey.find({
      where: {
        surveyType: SurveyTypes.Programs,
      },
    });

    return models.Program.find({
      where: {
        id: In(surveys.map(survey => survey.programId)),
      },
      order: {
        name: 'ASC',
      },
    });
  });

  if (programsIsLoading) {
    return <LoadingScreen />;
  }

  if (programsError) {
    return <ErrorScreen error={programsError} />;
  }

  const onNavigateToSurveyList = (program: Program): void => {
    navigation.navigate(Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.Index, {
      programId: program.id,
      programName: program.name,
    });
  };

  return (
    <FullView>
      <FlatList
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          backgroundColor: theme.colors.BACKGROUND_GREY,
          paddingTop: 5,
        }}
        showsVerticalScrollIndicator={false}
        data={programs}
        keyExtractor={(item): string => item.id}
        renderItem={({ item }): ReactElement => (
          <MenuOptionButton
            key={item.id}
            title={item.name}
            onPress={(): void => onNavigateToSurveyList(item)}
            textProps={{
              fontWeight: 400,
              color: theme.colors.TEXT_SUPER_DARK,
            }}
            arrowForwardIconProps={{
              size: 16,
              fill: theme.colors.TEXT_DARK,
            }}
          />
        )}
        ItemSeparatorComponent={() => <Separator paddingLeft="5%" width="95%" />}
      />
    </FullView>
  );
};

export const ProgramListScreen = compose(withPatient)(Screen);
