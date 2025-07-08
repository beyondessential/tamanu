import React from 'react';
import { StyleSheet, View } from '@react-pdf/renderer';
import { HorizontalRule } from './HorizontalRule';
import { Row } from '../Layout';
import { Text } from '../../pdf/Text';
import { useLanguageContext } from '../../pdf/languageContext';

export const DataSection = ({
  title,
  children,
  hideTopRule = false,
  hideBottomRule = false,
  props,
}) => {
  const { pdfFont } = useLanguageContext();
  const styles = StyleSheet.create({
    title: {
      marginBottom: 3,
      fontSize: 11,
      fontFamily: pdfFont,
      fontWeight: 700,
    },
  });
  return (
    <View {...props}>
      <Text style={styles.title}>{title}</Text>
      {!hideTopRule && <HorizontalRule />}
      <Row>{children}</Row>
      {!hideBottomRule && <HorizontalRule />}
    </View>
  );
};
