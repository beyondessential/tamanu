import React, { useMemo, useRef, useCallback, ReactElement, useState } from 'react';
import { Screen } from './Screen';
import {
  getFormInitialValues,
  getFormSchema,
  mapInputVerticalPosition,
} from './helpers';
import { theme } from '/styled/theme';
import { ProgramAddDetailsScreenProps } from '/interfaces/screens/ProgramsStack/ProgramAddDetails/ProgramAddDetailsScreenProps';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native';
import { Routes } from '/helpers/routes';

import { MenuOptionButton } from '/components/MenuOptionButton';
import { StyledView, StyledText } from '/styled/common';
import { Separator } from '/components/Separator';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { surveyStore } from '../../surveyStore';
import { useCancelableEffect } from '/helpers/hooks';

const SurveyResponseItem = ({ surveyResponse }) => {
  const navigation = useNavigation();
  const onPress = useCallback(() => navigation.navigate(
    Routes.HomeStack.ProgramStack.SurveyResponseDetailsScreen,
    {
      surveyResponse
    }
  ));

  const { patient, program } = surveyResponse;

  return (
    <TouchableOpacity onPress={onPress}>
      <StyledView height={55} justifyContent="center">
        <StyledText>{ program.name }</StyledText>
        <StyledText>{`${patient.firstName} ${patient.lastName}`}</StyledText>
      </StyledView>
    </TouchableOpacity>
  );
};

export const ProgramViewHistoryScreen = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { program } = route.params;
  const navigation = useNavigation();

  const [responses] = useCancelableEffect([], () => surveyStore.getResponses());

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
      keyExtractor={(item): string => item.name}
      renderItem={({ item }) => <SurveyResponseItem surveyResponse={item} />}
      ItemSeparatorComponent={Separator}
    />
  );
};
