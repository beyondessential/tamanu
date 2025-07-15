/* eslint-disable no-undef */
import React, { createContext, useContext, useMemo } from 'react';
import { cloneDeep } from 'lodash';
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
  const { translations, getSetting, settings, ...other } = props;

  const isGlobalFontEnabled = getSetting ? getSetting('features.useGlobalPdfFont') : settings?.features?.useGlobalPdfFont;
  const pdfFont = isGlobalFontEnabled ? 'GlobalPdfFont' : 'Helvetica';
  const pdfFontBold = isGlobalFontEnabled ? 'GlobalPdfFont-Bold' : 'Helvetica-Bold';

  const contextValue = useMemo(() => {
    return {
      makeIntlStyleSheet(style) {
        if (typeof style !== 'object') return {};
        return cloneDeep(style);
      },
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
      pdfFont,
      pdfFontBold,
    };
  }, [translations, pdfFont, pdfFontBold]);

  // unsure that we are using only one provider for the component tree
  return 'makeIntlStyleSheet' in context ? (
    <Component {...other} getSetting={getSetting} />
  ) : (
    <LanguageContext.Provider value={contextValue}>
      <Component {...other} getSetting={getSetting} />
    </LanguageContext.Provider>
  );
};
