import React from 'react';
import { StyleSheet, View, Text } from '@react-pdf/renderer';
import { HorizontalRule } from './HorizontalRule';
import { Row } from '../patientCertificates/Layout';

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
