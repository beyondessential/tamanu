import type { NavigationProp } from '@react-navigation/native';
import React, { type ReactElement } from 'react';
import CountryFlag from 'react-native-country-flag';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styled from 'styled-components';
import { isISO31661Alpha2 } from 'validator';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Routes } from '~/ui/helpers/routes';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

const ButtonContainer = styled(StyledView)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 3px 0;
`;

interface LanguageSelectButtonProps {
  navigation: NavigationProp<any>;
}

export const LanguageSelectButton = ({ navigation }: LanguageSelectButtonProps): ReactElement => {
  const { language, languageOptions } = useTranslation();

  if (!languageOptions || languageOptions.length <= 1) return null;

  const onNavigateToLanguageSelect = () => {
    navigation.navigate(Routes.SignUpStack.LanguageSelect);
  };

  const languageOption = languageOptions.find(o => o.languageCode === language);

  return (
    <StyledTouchableOpacity onPress={onNavigateToLanguageSelect}>
      <StyledView
        borderColor="white"
        borderBottomWidth={1}
        width={screenPercentageToDP(30, Orientation.Width)}
      >
        <StyledText fontSize={12} color={theme.colors.TEXT_SOFT}>
          Language
        </StyledText>

        <ButtonContainer>
          {languageOption?.countryCode && isISO31661Alpha2(languageOption.countryCode) && (
            <CountryFlag isoCode={languageOption.countryCode} size={22} />
          )}
          <StyledText color={theme.colors.WHITE}>{languageOption?.label}</StyledText>
          <Icon color={theme.colors.WHITE} name="chevron-down" size={20} />
        </ButtonContainer>
      </StyledView>
    </StyledTouchableOpacity>
  );
};
