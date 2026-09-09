import React, { type ReactElement, useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

import { Dropdown } from '../Dropdown';
import { StyledText, StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { TranslatedText } from '../Translations/TranslatedText';
import useLanguageOptionsQuery from '~/ui/hooks/queries/useLanguageOptionsQuery';
import useServersQuery from '~/ui/hooks/queries/useServersQuery';

const usePrepareLanguageData = (): void => {
  const {
    language: selectedLanguage,
    languageOptions,
    setLanguageOptions,
    setLanguage,
    host,
  } = useTranslation();
  const { data: fetchedLanguageOptions } = useLanguageOptionsQuery(host);

  useEffect(
    function syncLanguageOptionsIntoTranslationContext() {
      if (!fetchedLanguageOptions?.length) return;
      if (
        selectedLanguage &&
        JSON.stringify(languageOptions) === JSON.stringify(fetchedLanguageOptions)
      ) {
        return;
      }
      setLanguage(fetchedLanguageOptions[0].languageCode);
      setLanguageOptions(fetchedLanguageOptions);
    },
    [fetchedLanguageOptions, languageOptions, selectedLanguage, setLanguage, setLanguageOptions],
  );
};

export const ServerSelector = ({ onChange, label, value, error }): ReactElement => {
  usePrepareLanguageData();
  const netInfo = useNetInfo();
  const { setLanguageOptions, setLanguage, setHost } = useTranslation();
  const { data: options, isError } = useServersQuery({
    enabled: netInfo.isInternetReachable === true,
  });

  const updateHost = value => {
    onChange(value);
    setHost(value);
    if (!value) {
      setLanguage('en');
      setLanguageOptions(null);
    }
  };

  if (!netInfo.isInternetReachable) {
    return <StyledText color={theme.colors.ALERT}>No internet connection available.</StyledText>;
  }

  if (isError && !options?.length) {
    return (
      <StyledText color={theme.colors.ALERT}>
        <TranslatedText
          stringId="login.serverSelect.error.couldNotLoad"
          fallback="Could not load the list of countries. Please check your connection and try again."
        />
      </StyledText>
    );
  }

  return (
    <StyledView style={{ zIndex: 9999 }}>
      <Dropdown
        value={value}
        options={options ?? []}
        onChange={updateHost}
        label={label}
        fixedHeight
        selectPlaceholderText="Select"
        labelColor="white"
        error={error}
      />
    </StyledView>
  );
};
