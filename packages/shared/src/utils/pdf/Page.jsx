import React from 'react';
import { Page as BasePage } from '@react-pdf/renderer';
import { useLanguageContext } from './languageContext';
import { flatten } from './flattenStyles';

export const Page = ({ style, ...props }) => {
  const { makeIntlStyleSheet } = useLanguageContext();
  const mergedStyle = flatten(style);
  const newStyles = makeIntlStyleSheet({ fontFamily: 'Helvetica', ...mergedStyle });
  return <BasePage style={newStyles} {...props} />;
};
