import React from 'react';
import { Text as BaseText } from '@react-pdf/renderer';
import { useLanguageContext } from './languageContext';
import { flatten } from './flattenStyles';

export const Text = ({ style, bold, ...props }) => {
  const { makeIntlStyleSheet } = useLanguageContext();
  const mergedStyle = flatten(style);
  const newStyles = makeIntlStyleSheet(
    {
      ...mergedStyle,
      ...(bold && {
        fontFamily:
          mergedStyle.fontFamily === 'Helvetica-Oblique'
            ? 'Helvetica-BoldOblique'
            : 'Helvetica-Bold',
      }),
    },
    bold,
  );
  return <BaseText style={newStyles} {...props} />;
};
