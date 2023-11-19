import React, { useState, ReactElement, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledView, StyledTouchableOpacity } from '~/ui/styled/common';
import { readConfig, writeConfig } from '~/services/config';
import { useBackend } from '~/ui/hooks';
import { Routes } from '~/ui/helpers/routes';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ButtonContainer = styled(StyledView)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 3px 0;
`;

export const LanguageSelectButton = ({ navigation }): ReactElement => {
  const [language, setLanguage] = useState(null);
  const [languageLabels, setLanguageLabels] = useState({});

  const {
    models: { TranslatedString },
  } = useBackend();

  const getLanguageFromConfig = useCallback(async () => {
    const language = await readConfig('language');
    setLanguage(language);
  }, []);

  const onNavigateToLanguageSelect = useCallback(() => {
    console.log('onNavigateToLanguageSelect...');
    navigation.navigate(Routes.SignUpStack.LanguageSelect);
  }, []);

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => getLanguageFromConfig());
    return () => focusListener();
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const labelRecords = await TranslatedString.getLanguageOptions();
      const labelObject = Object.fromEntries(
        labelRecords.map(({ label, value }) => [value, label]),
      );
      setLanguageLabels(labelObject);
    })();
  }, []);

  const isLanguageOptionsEmpty = Object.keys(languageLabels).length === 0;

  if (isLanguageOptionsEmpty) {
    return (
      <StyledText
        paddingTop={screenPercentageToDP('2.43', Orientation.Height)}
        paddingLeft={screenPercentageToDP('2.43', Orientation.Width)}
        color={theme.colors.WHITE}
      >
        Connect to server and sync to get available languages
      </StyledText>
    );
  }

  return (
    <StyledTouchableOpacity onPress={onNavigateToLanguageSelect}>
      <StyledView
        borderColor="white"
        borderBottomWidth={1}
        width={screenPercentageToDP('30', Orientation.Width)}
        marginLeft={screenPercentageToDP('2.43', Orientation.Width)}
        marginBottom={screenPercentageToDP('2.43', Orientation.Height)}
      >
        <StyledText fontSize={11} color={theme.colors.TEXT_SOFT}>
          Language
        </StyledText>

        <ButtonContainer>
          <StyledText color={theme.colors.WHITE}>{languageLabels[language]}</StyledText>
          <Icon color={theme.colors.WHITE} name="chevron-down" size={20} />
        </ButtonContainer>
      </StyledView>
    </StyledTouchableOpacity>
  );
};
