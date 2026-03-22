import React, {
  createContext,
  isValidElement,
  PropsWithChildren,
  ReactElement,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { DEFAULT_LANGUAGE_CODE, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';
import { DevSettings } from 'react-native';
import { useBackend } from '../hooks';
import { isEmpty, upperFirst } from 'lodash';
import { registerYup } from '../helpers/yupMethods';
import { readConfig, writeConfig } from '~/services/config';
import { LanguageOption } from '~/models/TranslatedString';
import { getEnumStringId } from '../components/Translations/TranslatedEnum';
import { getReferenceDataStringId } from '../components/Translations/TranslatedReferenceData';
import { SYNC_EVENT_ACTIONS } from '~/services/sync/types';

export type Casing = 'lower' | 'upper' | 'sentence';

type Replacements = { [key: string]: any };

export type GetTranslationFunction = (
  stringId: string,
  fallback?: string,
  translationOptions?: TranslationOptions,
) => string;

export interface TranslatedTextProps {
  stringId: string;
  fallback: string;
  replacements?: Replacements;
  casing?: Casing;
}

interface TranslatedReferenceDataProps {
  value: string;
  category: string;
  fallback: string;
  placeholder?: string;
}

interface TranslationContextData {
  debugMode: boolean;
  language: string;
  languageOptions: LanguageOption[];
  setLanguageOptions: (languageOptions: LanguageOption[]) => void;
  getTranslation: GetTranslationFunction;
  setLanguage: (language: string) => void;
  host: string;
  setHost: (host: string) => void;
  getEnumTranslation: (enumValues: Record<string, string>, value: string) => string;
  getReferenceDataTranslation: (props: TranslatedReferenceDataProps) => string;
}

interface TranslationOptions {
  replacements?: Replacements;
  casing?: Casing;
}

// Duplicated from TranslatedText.js on desktop
export const replaceStringVariables = (
  templateString: string,
  translationOptions: TranslationOptions,
  translations?: object,
) => {
  const { replacements, casing } = translationOptions || {};
  if (!replacements) return applyCasing(templateString, casing);
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      const replacement = replacements[part.slice(1)] ?? part;
      // Replacements might be a string or a translatable string component, handle each case
      if (!isValidElement(replacement)) return replacement;

      const replacementElement = replacement as ReactElement<TranslatedTextProps>;
      const translation =
        translations?.[replacementElement.props.stringId] || replacementElement.props.fallback;
      return applyCasing(translation, replacementElement.props.casing);
    })
    .join('');

  return applyCasing(result, casing);
};

// duplicated from translationFactory.js
const applyCasing = (text: string, casing: Casing) => {
  if (!casing) return text;
  if (casing === 'lower') return text.toLocaleLowerCase();
  if (casing === 'upper') return text.toLocaleUpperCase();
  if (casing === 'sentence') return upperFirst(text);
  throw new Error(`applyCasing called with unhandled value: ${casing}`);
};

const TranslationContext = createContext<TranslationContextData>({
  debugMode: false,
  language: 'en',
  languageOptions: null,
  setLanguageOptions: () => {},
  getTranslation: () => {
    return '';
  },
  setLanguage: () => {},
  host: null,
  setHost: () => {},
  getEnumTranslation: () => '',
  getReferenceDataTranslation: () => '',
} as TranslationContextData);

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const { models, syncManager } = useBackend();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [translations, setTranslations] = useState({});
  const [languageOptions, setLanguageOptions] = useState(null);
  const [language, setLanguage] = useState(null);
  const [host, setHost] = useState(null);

  const getLanguageOptions = useCallback(async () => {
    let languageOptionArray = await models.TranslatedString.getLanguageOptions();

    // Filter out the default language if we have a custom English language
    if (languageOptionArray.some(({ languageCode }) => languageCode === ENGLISH_LANGUAGE_CODE)) {
      languageOptionArray = languageOptionArray.filter(
        ({ languageCode }) => languageCode !== DEFAULT_LANGUAGE_CODE,
      );
    }

    if (languageOptionArray.length > 0) setLanguageOptions(languageOptionArray);
  }, [models.TranslatedString]);

  // Used to routinely fetch the
  const getLatestTranslations = useCallback(
    async (languageCode: string | null) => {
      if (!languageCode) return;

      await writeLanguage(languageCode);
      const translations = await models.TranslatedString.getForLanguage(languageCode);
      if (isEmpty(translations) && host) {
        // If we don't have translations synced down, fetch from the public server endpoint directly
        const response = await fetch(`${host}/api/public/translation/${languageCode}`);
        const data = await response.json();
        setTranslations(data);
      } else {
        setTranslations(translations);
      }
    },
    [host, models.TranslatedString],
  );

  const getTranslation = (
    stringId: string,
    fallback?: string,
    translationOptions?: TranslationOptions,
  ) => {
    if (!translations) return replaceStringVariables(fallback, translationOptions, translations);
    const translation = translations[stringId] ?? fallback;

    return replaceStringVariables(translation, translationOptions, translations);
  };

  const getEnumTranslation = (enumValues: Record<string, string>, value: string) => {
    if (!enumValues[value]) {
      return getTranslation('general.fallback.unknown', 'Unknown');
    }

    const stringId = getEnumStringId(value, enumValues);
    const fallback = enumValues[value];
    return getTranslation(stringId, fallback);
  };

  const getReferenceDataTranslation = ({
    value,
    category,
    fallback,
    placeholder,
  }: TranslatedReferenceDataProps) => {
    return value
      ? getTranslation(getReferenceDataStringId(value, category), fallback)
      : placeholder;
  };

  const writeLanguage = async (languageCode: string) => {
    await writeConfig('language', languageCode);
  };

  const restoreLanguage = async () => {
    const languageCode = await readConfig('language');
    setLanguage(languageCode);
  };

  useEffect(() => {
    registerYup(translations);
  }, [translations]);

  useEffect(() => {
    getLanguageOptions();
    getLatestTranslations(language);
  }, [language, getLatestTranslations, getLanguageOptions]);

  // Reload latest translations on successful sync
  useEffect(() => {
    const handler = () => {
      getLanguageOptions();
      getLatestTranslations(language);
    };

    syncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_SUCCESS, handler);

    return () => syncManager.emitter.off(SYNC_EVENT_ACTIONS.SYNC_SUCCESS, handler);
  }, [language, getLatestTranslations, getLanguageOptions, syncManager.emitter]);

  useEffect(() => {
    restoreLanguage();
    if (!__DEV__) return;
    DevSettings.addMenuItem('Toggle translation highlighting', () =>
      setIsDebugMode(oldDebugValue => !oldDebugValue),
    );
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
        language,
        languageOptions,
        setLanguageOptions,
        getTranslation,
        setLanguage,
        host,
        setHost,
        getEnumTranslation,
        getReferenceDataTranslation,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
