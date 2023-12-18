import React from 'react';
import { Row } from '../../../../shared/src/utils/patientCertificates';
import { HorizontalRule } from './HorizontalRule';
import { StyleSheet, View } from '@react-pdf/renderer';
import { Text } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    fontSize: 14,
    fontWeight: 500,
  },
});

export const DataSection = ({ title, children, props }) => {
  return (
    <View {...props}>
      <Text style={styles.title}>{title}</Text>
      <HorizontalRule />
      <Row>{children}</Row>
      <HorizontalRule />
    </View>
  );
};
