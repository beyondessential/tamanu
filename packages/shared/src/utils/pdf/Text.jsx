import React from 'react';
import { Text as BaseText } from '@react-pdf/renderer';
import { useLanguageContext } from './languageContext';
import { flatten } from './flattenStyles';

export const Text = ({ style, bold, ...props }) => {
  const { makeIntlStyleSheet, pdfFont, pdfFontBold } = useLanguageContext();
  const mergedStyle = flatten(style);
  const newStyles = makeIntlStyleSheet(
    {
      ...mergedStyle,
      ...(bold ? { fontFamily: pdfFontBold, fontWeight: 700 } : { fontFamily: pdfFont }),
    },
    bold,
  );
  return <BaseText style={newStyles} {...props} />;
};
