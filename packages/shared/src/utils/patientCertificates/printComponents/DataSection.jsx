import React from 'react';
import { StyleSheet, View } from '@react-pdf/renderer';
import { HorizontalRule } from './HorizontalRule';
import { Row } from '../Layout';
import { Text } from '../../pdf/Text';

const styles = StyleSheet.create({
  title: {
    marginBottom: 3,
    fontSize: 11,
    fontFamily: 'NotoKufiArabic-Bold',
  },
});

export const DataSection = ({
  title,
  children,
  hideTopRule = false,
  hideBottomRule = false,
  props,
}) => {
  return (
    <View {...props}>
      <Text style={styles.title}>{title}</Text>
      {!hideTopRule && <HorizontalRule />}
      <Row>{children}</Row>
      {!hideBottomRule && <HorizontalRule />}
    </View>
  );
};
