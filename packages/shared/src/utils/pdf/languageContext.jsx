/* eslint-disable no-undef */
import React, { createContext, useContext, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import path from 'path';
import { FONT } from '@tamanu/constants';
import { Font } from '@react-pdf/renderer';

const baseDir =
  typeof __dirname !== 'undefined' ? path.join(__dirname, '../../assets/fonts') : '../fonts';

// body font
Font.register({
  family: FONT.BATTAMBANG,
  fonts: [
    {
      src: path.join(baseDir, 'Battambang-Regular.ttf'),
      fontWeight: 400,
    },
    {
      src: path.join(baseDir, 'Battambang-900.ttf'),
      fontWeight: 500,
    },
  ],
});

// title font
Font.register({
  family: FONT.MOUL,
  src: path.join(baseDir, 'Moul-Regular.ttf'),
});

const boldFont = ['Helvetica-BoldOblique', 'Helvetica-Bold'];

const LanguageContext = createContext({});

export const getDefaultLanguage = () => {
  // in client
  if (typeof window === 'object' && 'localStorage' in window) {
    return window.localStorage.getItem('language');
  }
};

export const useLanguageContext = () => {
  const ctx = useContext(LanguageContext);
  return ctx;
};

export const withLanguageContext = Component => props => {
  const context = useLanguageContext();
  const { language, ...other } = props;

  const contextValue = useMemo(() => {
    return {
      makeIntlStyleSheet(style, forceToBodyFontWithGreaterFontWeight) {
        if (typeof style !== 'object') return {};
        const currentLanguage = language || getDefaultLanguage();

        const newStyles = cloneDeep(style);
        const currentFontFamily = newStyles?.fontFamily;

        if (
          currentLanguage === 'km' &&
          currentFontFamily &&
          currentFontFamily !== FONT.MOUL &&
          currentFontFamily !== FONT.BATTAMBANG
        ) {
          if (boldFont.includes(currentFontFamily) && !forceToBodyFontWithGreaterFontWeight) {
            newStyles.fontFamily = FONT.MOUL;
          } else {
            newStyles.fontFamily = FONT.BATTAMBANG;
            if (forceToBodyFontWithGreaterFontWeight) {
              newStyles.fontWeight = 500;
            }
          }
        }
        return newStyles;
      },
    };
  }, [language]);

  // unsure that we are using only one provider for the component tree
  return 'makeIntlStyleSheet' in context ? (
    <Component {...other} />
  ) : (
    <LanguageContext.Provider value={contextValue}>
      <Component {...other} />
    </LanguageContext.Provider>
  );
};
