import React from 'react';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { HorizontalRule } from './HorizontalRule';
import { Row } from '../Layout';

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    fontSize: 14,
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
  return (
    <View {...props}>
      <Text style={styles.title}>{title}</Text>
      {!hideTopRule && <HorizontalRule />}
      <Row>{children}</Row>
      {!hideBottomRule && <HorizontalRule />}
    </View>
  );
};
