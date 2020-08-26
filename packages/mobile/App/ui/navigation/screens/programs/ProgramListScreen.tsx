import React, { useState, useCallback, useEffect, ReactElement } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FullView, StyledText } from '/styled/common';
import { compose } from 'redux';
import { theme } from '/styled/theme';
import {
  MenuOptionButton,
  MenuOptionButtonProps,
} from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { withPatient } from '/containers/Patient';
import { IPatient } from '~/types';
import { joinNames } from '/helpers/user';
import { useBackendEffect } from '/helpers/hooks';

interface ProgramListScreenProps {
  selectedPatient: IPatient;
}

const Screen = ({ selectedPatient }: ProgramListScreenProps): ReactElement => {
  const navigation = useNavigation();

  const [surveys, error] = useBackendEffect(async ({ models }) => {
    const { Survey } = models;
    return Survey.find({});
  });

  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const onNavigateToSurvey = survey => {
    navigation.navigate(
      Routes.HomeStack.ProgramStack.ProgramTabs.name,
      { survey }
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
        <StyledText>Unable to get programs list: { error.message }</StyledText>
      ) : (
        <FlatList
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.BACKGROUND_GREY,
          }}
          showsVerticalScrollIndicator={false}
          data={surveys}
          keyExtractor={(item): string => item.title}
          renderItem={({ item }): ReactElement => (
            <MenuOptionButton 
              title={item.name}
              onPress={() => onNavigateToSurvey(item)}
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
