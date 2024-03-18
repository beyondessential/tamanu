/* eslint-disable no-undef */
import { StyleSheet, Font } from '@react-pdf/renderer';
import { cloneDeep } from 'lodash';
import path from 'path';
import { FONT } from '@tamanu/constants';
import { getDefaultLanguage } from './languageContext';

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

export const CustomStyleSheet = {
  create: styles => (
    language = getDefaultLanguage(),
    forceToBodyFontWithGreaterFontWeight = false,
  ) => {
    if (typeof styles !== 'object') return StyleSheet.create({});

    const newStyles = {};
    Object.entries(styles).forEach(([key, value]) => {
      newStyles[key] = cloneDeep(value);
      const currentFontFamily = newStyles[key]?.fontFamily;

      if (
        language === 'km' &&
        currentFontFamily &&
        currentFontFamily !== FONT.MOUL &&
        currentFontFamily !== FONT.BATTAMBANG
      ) {
        if (boldFont.includes(currentFontFamily) && !forceToBodyFontWithGreaterFontWeight) {
          newStyles[key].fontFamily = FONT.MOUL;
        } else {
          newStyles[key].fontFamily = FONT.BATTAMBANG;
          if (forceToBodyFontWithGreaterFontWeight) {
            newStyles[key].fontWeight = 500;
          }
        }
      }
    });

    return StyleSheet.create(newStyles);
  },
};
