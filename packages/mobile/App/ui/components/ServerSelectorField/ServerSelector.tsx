import React, { type ReactElement, useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

import { Dropdown } from '../Dropdown';
import { StyledText, StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { TranslatedText } from '../Translations/TranslatedText';
import useServersQuery from '~/ui/hooks/queries/useServersQuery';

export const ServerSelector = ({ onChange, label, value, error }): ReactElement => {
  const netInfo = useNetInfo();
  const { language, languageOptions, setLanguage, host, setHost } = useTranslation();
  const { data: options, isError } = useServersQuery({
    enabled: netInfo.isInternetReachable === true,
  });

  useEffect(
    function selectDefaultLanguageForHost() {
      if (!host || !languageOptions) return;
      if (languageOptions.some(({ languageCode }) => languageCode === language)) return;
      setLanguage(languageOptions[0].languageCode);
    },
    [host, language, languageOptions, setLanguage],
  );

  const updateHost = value => {
    onChange(value);
    setHost(value);
    if (!value) {
      setLanguage('en');
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
