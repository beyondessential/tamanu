import React, { ReactElement, useCallback } from 'react';
import styled from 'styled-components';

import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledView, StyledTouchableOpacity } from '~/ui/styled/common';
import { Routes } from '~/ui/helpers/routes';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { NavigationProp } from '@react-navigation/native';

const ButtonContainer = styled(StyledView)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 3px 0;
`;

type LanguageSelectButtonProps = {
  navigation: NavigationProp<any>;
};

export const LanguageSelectButton = ({ navigation }: LanguageSelectButtonProps): ReactElement => {
  const { language, languageOptions } = useTranslation();

  const onNavigateToLanguageSelect = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.LanguageSelect);
  }, []);

  const getLabel = (language: string) =>
    languageOptions.find(({ value }) => value === language)?.label;

  if (!languageOptions) {
    return (
      <StyledText
        paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
        paddingLeft={screenPercentageToDP(2.43, Orientation.Width)}
        color={theme.colors.WHITE}
      >
        Connect to server and sync to get available languages
      </StyledText>
    );
  }

  return (
    <StyledTouchableOpacity
      marginTop={screenPercentageToDP(3.43, Orientation.Height)}
      onPress={onNavigateToLanguageSelect}
    >
      <StyledView
        borderColor="white"
        borderBottomWidth={1}
        width={screenPercentageToDP(30, Orientation.Width)}
        marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
      >
        <StyledText fontSize={11} color={theme.colors.TEXT_SOFT}>
          Language
        </StyledText>

        <ButtonContainer>
          <StyledText color={theme.colors.WHITE}>{getLabel(language)}</StyledText>
          <Icon color={theme.colors.WHITE} name="chevron-down" size={20} />
        </ButtonContainer>
      </StyledView>
    </StyledTouchableOpacity>
  );
};
