import type { QueryStatus, UseQueryResult } from '@tanstack/react-query';
import { upperFirst } from 'es-toolkit';
import React, {
  createContext,
  isValidElement,
  type ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DevSettings } from 'react-native';
import type { LanguageOption } from '~/models/TranslatedString';
import { readConfig, writeConfig } from '~/services/config';
import { getEnumStringId } from '../components/Translations/TranslatedEnum';
import { getReferenceDataStringId } from '../components/Translations/TranslatedReferenceData';
import { registerYup } from '../helpers/yupMethods';
import useLanguageOptionsQuery, {
  useLocalLanguageOptionsQuery,
} from '../hooks/queries/useLanguageOptionsQuery';
import useTranslationsQuery, { type Translations } from './useTranslationsQuery';

export type Casing = 'lower' | 'upper' | 'sentence';

interface Replacements {
  [key: string]: string;
}

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
  languageOptions: LanguageOption[] | undefined;
  languageOptionsStatus: QueryStatus;
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

interface Translator extends Pick<
  TranslationContextData,
  'getEnumTranslation' | 'getReferenceDataTranslation' | 'getTranslation'
> {}

const createTranslator = (translations: Translations | undefined): Translator => {
  const getTranslation: GetTranslationFunction = (stringId, fallback, translationOptions) => {
    const translation = translations?.[stringId] ?? fallback;
    return replaceStringVariables(translation, translationOptions, translations);
  };

  const getEnumTranslation = (enumValues: Record<string, string>, value: string) => {
    const fallback = enumValues[value];
    if (fallback === undefined) return getTranslation('general.fallback.unknown', 'Unknown');
    const stringId = getEnumStringId(value, enumValues);
    return getTranslation(stringId, fallback);
  };

  const getReferenceDataTranslation = ({
    value,
    category,
    fallback,
    placeholder,
  }: TranslatedReferenceDataProps) =>
    value ? getTranslation(getReferenceDataStringId(value, category), fallback) : placeholder;

  return { getTranslation, getEnumTranslation, getReferenceDataTranslation };
};

const TranslationContext = createContext<TranslationContextData>({
  debugMode: false,
  language: 'en',
  languageOptions: undefined,
  languageOptionsStatus: 'pending',
  getTranslation: () => {
    return '';
  },
  setLanguage: () => {},
  host: null,
  setHost: () => {},
  getEnumTranslation: () => '',
  getReferenceDataTranslation: () => '',
} as const);

/**
 * The stored choice wins while it is one of the available options (or while the options are
 * unknown). Otherwise fall back to the first option — e.g. a fresh install, or a language removed
 * by a later sync. The fallback is derived, never persisted: the options list may be a partial or
 * stale local snapshot (no host yet, server unreachable), which must not clobber the stored choice.
 */
const resolveLanguage = (
  storedLanguage: string | null,
  languageOptions: LanguageOption[] | undefined,
): string | null => {
  if (!languageOptions?.length) return storedLanguage;
  if (languageOptions.some(({ languageCode }) => languageCode === storedLanguage)) {
    return storedLanguage;
  }
  return languageOptions[0].languageCode;
};

/**
 * Consumers only need to know whether there is a list to offer yet, so the two sources collapse to
 * one status. An empty list while either source is still in flight stays `pending` — a device with
 * nothing synced would otherwise flash an empty state before the server answers — and `error` is
 * reserved for there being nothing left to wait for.
 */
const resolveLanguageOptionsStatus = (
  languageOptions: LanguageOption[] | undefined,
  remoteQuery: UseQueryResult<LanguageOption[]>,
  localQuery: UseQueryResult<LanguageOption[]>,
): QueryStatus => {
  if (languageOptions?.length) return 'success';
  if (remoteQuery.isLoading || localQuery.isLoading) return 'pending';
  if (remoteQuery.isError || localQuery.isError) return 'error';
  return 'success';
};

export const TranslationProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [storedLanguage, setStoredLanguage] = useState<string | null>(null);
  const [isLanguageRestored, setIsLanguageRestored] = useState(false);
  const [host, setHost] = useState<string | null>(null);

  const remoteLanguageOptionsQuery = useLanguageOptionsQuery(host);
  const localLanguageOptionsQuery = useLocalLanguageOptionsQuery();
  const languageOptions = remoteLanguageOptionsQuery.data ?? localLanguageOptionsQuery.data;
  const languageOptionsStatus = resolveLanguageOptionsStatus(
    languageOptions,
    remoteLanguageOptionsQuery,
    localLanguageOptionsQuery,
  );
  // Hold off until the stored language is known, so the first option isn't briefly shown instead
  const language = isLanguageRestored ? resolveLanguage(storedLanguage, languageOptions) : null;
  const { data: translations } = useTranslationsQuery(language, host);

  const setLanguage = useCallback((languageCode: string) => {
    setStoredLanguage(languageCode);
    void writeConfig('language', languageCode);
  }, []);

  const translator = useMemo(() => createTranslator(translations), [translations]);

  useEffect(() => void registerYup(translations), [translations]);

  useEffect(() => {
    const restoreLanguage = async () => {
      const languageCode = await readConfig('language');
      setStoredLanguage(languageCode ?? null);
      setIsLanguageRestored(true);
    };
    restoreLanguage();
  }, []);

  useEffect(() => {
    if (!__DEV__) return;
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(prev => !prev));
  }, []);

  const value = useMemo<TranslationContextData>(
    () => ({
      debugMode: isDebugMode,
      host,
      language,
      languageOptions,
      languageOptionsStatus,
      setHost,
      setLanguage,
      ...translator,
    }),
    [host, isDebugMode, language, languageOptions, languageOptionsStatus, setLanguage, translator],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
