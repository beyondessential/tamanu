import React, { useCallback, ReactElement } from 'react';
import { theme } from '/styled/theme';
import { SurveyResponseScreenProps } from '/interfaces/screens/ProgramsStack/SurveyResponseScreen';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native';
import { Routes } from '/helpers/routes';

import { ErrorScreen } from '/components/ErrorScreen';
import { LoadingScreen } from '/components/LoadingScreen';
import { StyledView, StyledText } from '/styled/common';
import { Separator } from '/components/Separator';
import { SurveyResultBadge } from '/components/SurveyResultBadge';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useBackendEffect } from '~/ui/hooks';
import { formatDate } from '/helpers/date';
import { DateFormats } from '~/ui/helpers/constants';

const SurveyResponseItem = ({ surveyResponse, responseIndex }): ReactElement => {
  const navigation = useNavigation();
  const onPress = useCallback(
    () => navigation.navigate(Routes.HomeStack.ProgramStack.SurveyResponseDetailsScreen, {
      surveyResponseId: surveyResponse.id,
    }),
    [],
  );

  const { survey, endTime = '', result, resultText } = surveyResponse;

  return (
    <TouchableOpacity onPress={onPress}>
      <StyledView
        height={60}
        justifyContent="space-between"
        flexDirection="column"
        padding={8}
        background={responseIndex % 2 ? theme.colors.BACKGROUND_GREY : theme.colors.WHITE}
      >
        <StyledView
          minHeight={40}
          paddingLeft={16}
          paddingRight={16}
          justifyContent="space-between"
          alignItems="center"
          flexDirection="row"
        >
          <StyledView>
            <StyledText marginBottom="5" fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
              {survey.name}
            </StyledText>
            <StyledText color={theme.colors.TEXT_DARK} fontSize={13} fontWeight="bold">
              {formatDate(endTime, DateFormats.DATE_AND_TIME)}
            </StyledText>
          </StyledView>
          {resultText ? <SurveyResultBadge result={result} resultText={resultText} /> : null}
        </StyledView>
      </StyledView>
    </TouchableOpacity>
  );
};

export const ProgramViewHistoryScreen = ({ route }: SurveyResponseScreenProps): ReactElement => {
  const { surveyId, selectedPatient, latestResponseId } = route.params;

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

  const responsesToShow = selectedPatient
    ? responses.filter(({ encounter }) => encounter.patient.id === selectedPatient.id)
    : responses;

  return (
    <FlatList
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.BACKGROUND_GREY,
      }}
      showsVerticalScrollIndicator={false}
      data={responsesToShow}
      keyExtractor={(item): string => item.name}
      renderItem={({ item, index }): ReactElement => (
        <SurveyResponseItem responseIndex={index} surveyResponse={item} />
      )}
      ItemSeparatorComponent={Separator}
    />
  );
};
