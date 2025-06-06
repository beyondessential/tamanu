/* eslint-disable no-undef */
import React, { createContext, useContext, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import path from 'path';
import { FONT } from '@tamanu/constants';
import { Font } from '@react-pdf/renderer';
import { translationFactory } from '../translation/translationFactory';
import { getEnumPrefix } from '@tamanu/shared/utils/enumRegistry';

const baseDir =
  typeof __dirname !== 'undefined' ? path.join(__dirname, '../../assets/fonts') : '/fonts';

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

// Arabic font - temporarily disabled due to font format issues
// Font.register({
//   family: FONT.NOTO_SANS_ARABIC,
//   src: path.join(baseDir, 'NotoSansArabic.ttf'),
// });

// Arabic font - temporarily commented out due to font format issues
// Font.register({
//   family: FONT.NOTO_SANS_ARABIC,
//   src: 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvu3CBFQLaig.ttf',
// });

// title font
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
});

const boldFont = ['Helvetica-BoldOblique', 'Helvetica-Bold'];

const LanguageContext = createContext({});

const getDefaultLanguage = () => {
  // in client
  if (typeof window === 'object' && 'localStorage' in window) {
    return window.localStorage.getItem('language');
  }
};

export const useLanguageContext = () => {
  const ctx = useContext(LanguageContext);
  return ctx;
};

export const withLanguageContext = (Component) => (props) => {
  const context = useLanguageContext();
  const { language, translations, ...other } = props;

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

        if (
          currentLanguage === 'sy' &&
          currentFontFamily &&
          currentFontFamily !== FONT.NOTO_SANS_ARABIC
        ) {
          newStyles.fontFamily = FONT.NOTO_SANS_ARABIC;
          if (boldFont.includes(currentFontFamily) || forceToBodyFontWithGreaterFontWeight) {
            newStyles.fontWeight = 500;
          }
        }

        return newStyles;
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
    };
  }, [language, translations]);

  // unsure that we are using only one provider for the component tree
  return 'makeIntlStyleSheet' in context ? (
    <Component {...other} />
  ) : (
    <LanguageContext.Provider value={contextValue}>
      <Component {...other} />
    </LanguageContext.Provider>
  );
};
