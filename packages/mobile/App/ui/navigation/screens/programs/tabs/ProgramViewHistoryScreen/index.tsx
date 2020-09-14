import React, { useCallback, ReactElement } from 'react';
import { theme } from '/styled/theme';
import { ProgramAddDetailsScreenProps } from '/interfaces/screens/ProgramsStack/ProgramAddDetails/ProgramAddDetailsScreenProps';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native';
import { Routes } from '/helpers/routes';

import { ErrorScreen } from '/components/ErrorScreen';
import { LoadingScreen } from '/components/LoadingScreen';
import { StyledView, StyledText } from '/styled/common';
import { Separator } from '/components/Separator';
import { SurveyResultBadge } from '/components/SurveyResultBadge';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useBackendEffect } from '/helpers/hooks';

const SurveyResponseItem = ({
  surveyResponse,
  responseIndex,
}): ReactElement => {
  const navigation = useNavigation();
  const onPress = useCallback(
    () => navigation.navigate(
      Routes.HomeStack.ProgramStack.SurveyResponseDetailsScreen,
      {
        surveyResponseId: surveyResponse.id,
      },
    ),
    [],
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
          <StyledText fontSize={10}>
            {`${date.toString().slice(0, 24)}`}
          </StyledText>
        </StyledView>
        <StyledView justifyContent="space-between" flexDirection="row">
          <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
            {survey.name}
          </StyledText>
          {result !== undefined ? (
            <SurveyResultBadge result={result} />
          ) : (
            <StyledText color="#ccc">N/A</StyledText>
          )}
        </StyledView>
      </StyledView>
    </TouchableOpacity>
  );
};

export const ProgramViewHistoryScreen = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { surveyId, latestResponseId } = route.params;
  const navigation = useNavigation();

  // use latestResponseId to ensure that we refresh when
  // a new survey is submitted (as this tab can be mounted while
  // it isn't active)
  const [responses, error] = useBackendEffect(
    ({ models }) => models.Survey.getResponses(surveyId),
    [latestResponseId],
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
      keyExtractor={(item): string => item.name}
      renderItem={({ item, index }): ReactElement => (
        <SurveyResponseItem responseIndex={index} surveyResponse={item} />
      )}
      ItemSeparatorComponent={Separator}
    />
  );
};
