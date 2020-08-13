import React, { useState, useCallback, useEffect, ReactElement } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FullView, StyledText } from '/styled/common';
import { compose } from 'redux';
import { ProgramModel } from '../../../models/Program';
import { theme } from '/styled/theme';
import {
  MenuOptionButton,
  MenuOptionButtonProps,
} from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { withPatient } from '/containers/Patient';
import { PatientModel } from '../../../models/Patient';
import { joinNames } from '/helpers/user';
import { useBackendEffect } from '/helpers/hooks';
import { makeGetProgramsController } from '~/factories/programs/getPrograms';

interface ProgramListScreenProps {
  selectedPatient: PatientModel;
}

const Screen = ({ selectedPatient }: ProgramListScreenProps): ReactElement => {
  const navigation = useNavigation();

  const [programs, error] = useBackendEffect(backend => backend.getPrograms());

  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const onNavigateToProgram = program => {
    navigation.navigate(
      Routes.HomeStack.ProgramStack.ProgramTabs.name,
      { program }
    );
  };

  return (
    <FullView>
      <StackHeader
        title="Programs"
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      {error ? (
        <StyledText>Unable to get programs list...</StyledText>
      ) : (
        <FlatList
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.BACKGROUND_GREY,
          }}
          showsVerticalScrollIndicator={false}
          data={programs}
          keyExtractor={(item): string => item.title}
          renderItem={({ item }): ReactElement => (
            <MenuOptionButton 
              title={item.name}
              onPress={() => onNavigateToProgram(item)}
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
