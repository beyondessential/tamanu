import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '/styled/theme';
import { formatDate } from '/helpers/date';
import { StyledView, StyledText } from '/styled/common';
import { SurveyResultBadge } from '/components/SurveyResultBadge';
import { DateFormats } from '~/ui/helpers/constants';

export const SurveyResponseLink = ({
  surveyResponse,
  detailsRouteName,
  backgroundColor = theme.colors.WHITE,
}): ReactElement => {
  const navigation = useNavigation();

  if (!surveyResponse) {
    return null;
  }
  const { survey, endTime = '', resultText } = surveyResponse;

  return (
    <TouchableOpacity
      onPress={(): void => navigation.navigate(detailsRouteName, {
        surveyResponseId: surveyResponse.id,
      })
      }
    >
      <StyledView
        height={60}
        justifyContent="space-between"
        flexDirection="column"
        padding={8}
        background={backgroundColor}
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
            <StyledText
              marginBottom="5"
              fontWeight="bold"
              color={theme.colors.LIGHT_BLUE}
            >
              {survey.name}
            </StyledText>
            <StyledText
              color={theme.colors.TEXT_DARK}
              fontSize={13}
              fontWeight="bold"
            >
              {formatDate(endTime, DateFormats.DATE_AND_TIME)}
            </StyledText>
          </StyledView>
          {resultText ? <SurveyResultBadge resultText={resultText} /> : null}
        </StyledView>
      </StyledView>
    </TouchableOpacity>
  );
};
