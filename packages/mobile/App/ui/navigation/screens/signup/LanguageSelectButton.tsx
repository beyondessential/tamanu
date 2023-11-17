import React, { useState, ReactElement, useEffect, useCallback } from 'react';

import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledView, StyledTouchableOpacity } from '~/ui/styled/common';
import { readConfig } from '~/services/config';
import { useBackend } from '~/ui/hooks';
import { Routes } from '~/ui/helpers/routes';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
    console.log('focused');
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

  return (
    <StyledTouchableOpacity onPress={onNavigateToLanguageSelect}>
      <StyledView
        borderColor="white"
        borderBottomWidth={1}
        width={screenPercentageToDP('25', Orientation.Width)}
        marginLeft={screenPercentageToDP('2.43', Orientation.Width)}
        marginBottom={screenPercentageToDP('2.43', Orientation.Height)}
      >
        <StyledText fontSize={12} color={theme.colors.TEXT_SOFT}>
          Language
        </StyledText>
        <StyledText fontWeight="bold" color={theme.colors.WHITE}>
          {languageLabels[language]}<Icon name="chevron-down" style={{
            fontSize: 18,
          }} />
        </StyledText>
      </StyledView>
    </StyledTouchableOpacity>
  );
};
