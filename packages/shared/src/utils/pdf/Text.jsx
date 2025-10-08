import React from 'react';
import { Text as BaseText } from '@react-pdf/renderer';
import { useLanguageContext } from './languageContext';
import { flatten } from './flattenStyles';

/**
 * Sometimes we need to use Text without useLanguageContext hook.
 * Eg: when rendering the text inside react-pdf-renderer View's render function,
 * which does not allow to have react hook calls
 */
export const TextWithoutContext = ({
  style,
  bold,
  makeIntlStyleSheet,
  pdfFontBold,
  pdfFont,
  ...props
}) => {
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

export const Text = props => {
  const { makeIntlStyleSheet, pdfFont, pdfFontBold } = useLanguageContext();
  return (
    <TextWithoutContext
      makeIntlStyleSheet={makeIntlStyleSheet}
      pdfFont={pdfFont}
      pdfFontBold={pdfFontBold}
      {...props}
    />
  );
};
