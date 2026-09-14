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
import useLanguageOptionsQuery from '../hooks/queries/useLanguageOptionsQuery';
import useTranslationsQuery, { type Translations } from '../hooks/queries/useTranslationsQuery';

export type Casing = 'lower' | 'upper' | 'sentence';

interface Replacements {
  [key: string]: any;
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
  'getTranslation' | 'getEnumTranslation' | 'getReferenceDataTranslation'
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
  getTranslation: () => {
    return '';
  },
  setLanguage: () => {},
  host: null,
  setHost: () => {},
  getEnumTranslation: () => '',
  getReferenceDataTranslation: () => '',
} as const);

export const TranslationProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [language, setLanguageState] = useState<string | null>(null);
  const [isLanguageRestored, setIsLanguageRestored] = useState(false);
  const [host, setHost] = useState<string | null>(null);

  const { data: translations } = useTranslationsQuery(language, host);
  const { data: languageOptions } = useLanguageOptionsQuery(host);

  const setLanguage = useCallback((languageCode: string) => {
    setLanguageState(languageCode);
    void writeConfig('language', languageCode);
  }, []);

  /**
   * Keep the selected language one of the available options, defaulting to the first when
   * nothing valid is stored — e.g. a fresh install, or a language removed by a later sync
   */
  useEffect(() => {
    if (!isLanguageRestored || !languageOptions?.length) return;
    if (language && languageOptions.some(({ languageCode }) => languageCode === language)) return;
    setLanguage(languageOptions[0].languageCode);
  }, [isLanguageRestored, language, languageOptions, setLanguage]);

  const translator = useMemo(() => createTranslator(translations), [translations]);

  useEffect(() => void registerYup(translations), [translations]);

  useEffect(() => {
    const restoreLanguage = async () => {
      const languageCode = await readConfig('language');
      setLanguageState(languageCode ?? null);
      setIsLanguageRestored(true);
    };
    restoreLanguage();
  }, []);

  useEffect(() => {
    if (!__DEV__) return;
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(prev => !prev));
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
        host,
        language,
        languageOptions,
        setHost,
        setLanguage,
        ...translator,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
