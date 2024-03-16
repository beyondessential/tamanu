import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { HorizontalRule } from './HorizontalRule';
import { Row } from '../Layout';
import { CustomStyleSheet } from '../../renderPdf';
import { useLanguageContext } from '../../languageContext';

const styles = CustomStyleSheet.create({
  title: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    fontSize: 11,
    fontWeight: 500,
  },
});

export const DataSection = ({
  title,
  children,
  hideTopRule = false,
  hideBottomRule = false,
  props,
}) => {
  const { language } = useLanguageContext();
  return (
    <View {...props}>
      <Text style={styles(language).title}>{title}</Text>
      {!hideTopRule && <HorizontalRule />}
      <Row>{children}</Row>
      {!hideBottomRule && <HorizontalRule />}
    </View>
  );
};
