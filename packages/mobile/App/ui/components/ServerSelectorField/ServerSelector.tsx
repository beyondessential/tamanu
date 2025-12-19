import React, { ReactElement, useEffect, useState } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { keyBy, mapValues, uniq } from 'lodash';

import { Dropdown, SelectOption } from '../Dropdown';
import { StyledText, StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import * as overrides from '/root/serverOverrides.json';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { LanguageOption } from '~/models/TranslatedString';
import { DEFAULT_LANGUAGE_CODE, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';

type Server = {
  name: string;
  type: string;
  host: string;
};

const applyDefaultsToTranslations = ({
  [DEFAULT_LANGUAGE_CODE]: defaultText,
  [ENGLISH_LANGUAGE_CODE]: enText,
  ...rest
}) => ({
  ...rest,
  [ENGLISH_LANGUAGE_CODE]: enText || defaultText,
});

const usePrepareLanguageData = async () => {
  const {
    language: selectedLanguage,
    languageOptions,
    setLanguageOptions,
    setLanguage,
    host,
  } = useTranslation();
  useEffect(() => {
    const getOptions = async () => {
      const response = await fetch(`${host}/api/public/translation/languageOptions`);
      const { languageNames = [], languagesInDb = [], countryCodes = [] } = await response.json();
      const languageDisplayNames = applyDefaultsToTranslations(
        mapValues(keyBy(languageNames, 'language'), 'text'),
      );
      const languageCountryCodes = applyDefaultsToTranslations(
        mapValues(keyBy(countryCodes, 'language'), 'text'),
      );
      const languagesInDbDefaulted = uniq(
        languagesInDb.map(({ language }) =>
          language === DEFAULT_LANGUAGE_CODE ? ENGLISH_LANGUAGE_CODE : language,
        ),
      ).map(
        (language): LanguageOption => ({
          label: languageDisplayNames[language],
          languageCode: language,
          countryCode: languageCountryCodes[language] ?? null,
        }),
      );
      if (
        !selectedLanguage ||
        JSON.stringify(languageOptions) != JSON.stringify(languagesInDbDefaulted)
      ) {
        setLanguage(languagesInDbDefaulted[0].languageCode);
        setLanguageOptions(languagesInDbDefaulted);
      }
    };
    if (host) {
      getOptions();
    }
  }, [host, languageOptions, selectedLanguage, setLanguage, setLanguageOptions]);
};

const fetchServers = async (): Promise<SelectOption[]> => {
  // To use a local server, just edit this and select it.
  // The central server config is sticky, so you can safely revert it after
  // the first sync begins and it'll stay connecting to your local server.
  // return [{ label: 'Local', value: 'http://192.168.0.1:3000' }];

  // allows overriding the central server list or meta server in builds
  const { metaServer: metaServerOverride, centralServers: centralServerOverrides } = overrides;
  if (centralServerOverrides) {
    return centralServerOverrides;
  }

  const defaultMetaServer = 'https://meta.tamanu.app';
  const metaServer = metaServerOverride || defaultMetaServer;
  const response = await fetch(`${metaServer}/servers`);
  const servers: Server[] = await response.json();

  const options = servers.map(s => ({
    label: s.name,
    value: s.host,
  }));

  if (__DEV__) {
    // If dev mode, add a local server option using special alias to localhost
    options.unshift({
      label: 'Local central server (port 3000)',
      value: 'http://10.0.2.2:3000',
    });
  }

  return options;
};

export const ServerSelector = ({ onChange, label, value, error }): ReactElement => {
  usePrepareLanguageData();
  const [options, setOptions] = useState([]);
  const netInfo = useNetInfo();
  const { setLanguageOptions, setLanguage, setHost } = useTranslation();

  const updateHost = value => {
    onChange(value);
    setHost(value);
    if (!value) {
      setLanguage('en');
      setLanguageOptions(null);
    }
  };

  useEffect(() => {
    (async (): Promise<void> => {
      if (!value && netInfo.isInternetReachable) {
        const servers = await fetchServers();
        setOptions(servers);
      }
    })();
  }, [netInfo.isInternetReachable]);

  if (!netInfo.isInternetReachable) {
    return <StyledText color={theme.colors.ALERT}>No internet connection available.</StyledText>;
  }

  return (
    <StyledView style={{ zIndex: 9999 }}>
      <Dropdown
        value={value}
        options={options}
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
