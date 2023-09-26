import React, { ReactElement } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FullView } from '/styled/common';
import { compose } from 'redux';
import { theme } from '/styled/theme';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { Routes } from '/helpers/routes';
import { withPatient } from '/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { Program } from '~/models/Program';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

const Screen = (): ReactElement => {
  const navigation = useNavigation();

  const [programs, programsError, programsIsLoading] = useBackendEffect(({ models }) =>
    models.Program.find({
      order: {
        name: 'ASC',
      },
    }),
  );

  const [vitalsSurvey, vitalsError, isVitalsLoading] = useBackendEffect(({ models: m }) =>
    m.Survey.getVitalsSurvey(),
  );

  if (programsIsLoading || isVitalsLoading) {
    return <LoadingScreen />;
  }

  if (programsError || vitalsError) {
    return <ErrorScreen error={programsError || vitalsError} />;
  }

  const programsWithNoVital = programs.filter(program => program.id !== vitalsSurvey?.programId);

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
        data={programsWithNoVital}
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
