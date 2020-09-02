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

import { ErrorScreen } from '/components/ErrorScreen';
import { LoadingScreen } from '/components/LoadingScreen';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { StyledView, StyledText } from '/styled/common';
import { Separator } from '/components/Separator';
import { SurveyResultBadge } from '/components/SurveyResultBadge';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { FieldTypes } from '/helpers/fields';
import { useBackendEffect } from '/helpers/hooks';

const SurveyResponseItem = ({ surveyResponse, responseIndex }) => {
  const navigation = useNavigation();
  const onPress = useCallback(() =>
    navigation.navigate(
      Routes.HomeStack.ProgramStack.SurveyResponseDetailsScreen,
      {
        surveyResponseId: surveyResponse.id,
      },
    ),
  );

  const { encounter, survey, date = '', result } = surveyResponse;
  const { patient } = encounter;
  
  return (
    <TouchableOpacity onPress={onPress}>
      <StyledView
        height={60}
        justifyContent="space-between"
        flexDirection="column"
        padding={8}
        background={
          responseIndex % 2 ? theme.colors.BACKGROUND_GREY : theme.colors.WHITE
        }
      >
        <StyledView justifyContent="space-between" flexDirection="row">
          <StyledText fontWeight="bold">{`${patient.firstName} ${patient.lastName}`}</StyledText>
          <StyledText fontSize={10}>{`${date.toString().slice(0, 24)}`}</StyledText>
        </StyledView>
        <StyledView justifyContent="space-between" flexDirection="row">
          <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
            {survey.name}
          </StyledText>
          { result !== undefined
            ? <SurveyResultBadge result={result} />
            : <StyledText color="#ccc">N/A</StyledText>
            }
        </StyledView>
      </StyledView>
    </TouchableOpacity>
  );
};

export const ProgramViewHistoryScreen = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { surveyId } = route.params;
  const navigation = useNavigation();

  const [responses, error] = useBackendEffect(backend => backend.getResponses(surveyId));

  if(error) {
    return <ErrorScreen error={error} />
  }

  if(!responses) {
    return <LoadingScreen text={`Loading responses for ${surveyId}`} />;
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
      keyExtractor={(item): string => item.name}
      renderItem={({ item, index }) => (
        <SurveyResponseItem responseIndex={index} surveyResponse={item} />
      )}
      ItemSeparatorComponent={Separator}
    />
  );
};
