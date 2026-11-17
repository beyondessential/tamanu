import React from 'react';
import { Text as BaseText } from '@react-pdf/renderer';
import { useLanguageContext } from './languageContext';
import { parseNoteContent } from '../noteContent';

// Standard PDF fonts are separate families per variant, and the global font has no italic.
const getFontFamily = ({ bold, italic }, pdfFont, pdfFontBold) => {
  if (!italic || pdfFont !== 'Helvetica') return bold ? pdfFontBold : pdfFont;
  return bold ? 'Helvetica-BoldOblique' : 'Helvetica-Oblique';
};

export const FormattedNoteText = ({ content }) => {
  const { pdfFont, pdfFontBold } = useLanguageContext();
  return parseNoteContent(content).map((segment, index) => (
    <BaseText
      key={index}
      style={{
        fontFamily: getFontFamily(segment, pdfFont, pdfFontBold),
        textDecoration: segment.underline ? 'underline' : 'none',
      }}
    >
      {segment.text}
    </BaseText>
  ));
};
