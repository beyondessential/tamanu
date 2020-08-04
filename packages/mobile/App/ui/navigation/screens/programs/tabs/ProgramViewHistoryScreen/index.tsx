import React, {
  useMemo,
  useRef,
  useCallback,
  ReactElement,
  useState,
} from 'react';
import { Screen } from './Screen';
import {
  getFormInitialValues,
  getFormSchema,
  mapInputVerticalPosition,
} from './helpers';
import { theme } from '/styled/theme';
import { ProgramAddDetailsScreenProps } from '/interfaces/screens/ProgramsStack/ProgramAddDetails/ProgramAddDetailsScreenProps';
import { useNavigation } from '@react-navigation/native';
import { FlatList, ListItem } from 'react-native';
import { Routes } from '/helpers/routes';

import { MenuOptionButton } from '/components/MenuOptionButton';
import { StyledView, StyledText } from '/styled/common';
import { Separator } from '/components/Separator';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { surveyStore } from '../../surveyStore';
import { useCancelableEffect } from '/helpers/hooks';

const SurveyResponseItem = ({ surveyResponse, responseIndex }) => {
  const navigation = useNavigation();
  const onPress = useCallback(() =>
    navigation.navigate(
      Routes.HomeStack.ProgramStack.SurveyResponseDetailsScreen,
      {
        surveyResponse,
      },
    ),
  );

  const { patient, program, date } = surveyResponse;

  return (
    <TouchableOpacity onPress={onPress}>
      <StyledView
        height={60}
        justifyContent="space-between"
        flexDirection="column"
        padding={8}
        background={
          responseIndex % 2 ? theme.colors.BACKGROUND_GREY : theme.colors.WHITE
        }>
        <StyledText fontWeight="bold">{`${patient.firstName} ${patient.lastName}`}</StyledText>
        <StyledView justifyContent="space-between" flexDirection="row">
          <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
            {program.name}
          </StyledText>
          <StyledText>{`${date.toString().slice(0, 24)}`}</StyledText>
        </StyledView>
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
  console.log(responses);
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
      renderItem={({ item, index }) => (
        <SurveyResponseItem responseIndex={index} surveyResponse={item} />
      )}
      ItemSeparatorComponent={Separator}
    />
  );
};
