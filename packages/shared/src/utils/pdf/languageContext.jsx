/* eslint-disable no-undef */
import React, { createContext, useContext, useMemo } from 'react';
import { translationFactory } from '../translation/translationFactory';
import { getEnumPrefix } from '@tamanu/shared/utils/enumRegistry';
import { registerFonts } from './registerFonts';

registerFonts();

const LanguageContext = createContext({});

export const useLanguageContext = () => {
  const ctx = useContext(LanguageContext);
  return ctx;
};

export const withLanguageContext = Component => props => {
  const context = useLanguageContext();
  const { translations, ...other } = props;

  const contextValue = useMemo(() => {
    return {
      getTranslation(stringId, fallback, translationOptions) {
        const translationFunc = translationFactory(translations);
        const { value } = translationFunc(stringId, fallback, translationOptions);
        return value;
      },
      getEnumTranslation(enumValues, currentValue) {
        const translationFunc = translationFactory(translations);
        const fallback = enumValues[currentValue];
        const stringId = `${getEnumPrefix(enumValues)}.${currentValue}`;
        const { value } = translationFunc(stringId, fallback);
        return value;
      },
    };
  }, [translations]);

  // unsure that we are using only one provider for the component tree
  return 'makeIntlStyleSheet' in context ? (
    <Component {...other} />
  ) : (
    <LanguageContext.Provider value={contextValue}>
      <Component {...other} />
    </LanguageContext.Provider>
  );
};
