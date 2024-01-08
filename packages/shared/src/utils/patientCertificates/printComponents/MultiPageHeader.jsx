import { StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    flexDirection: 'row',
    top: 25,
    right: 50,
  },

  labelText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica-Bold',
  },

  valueText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica',
  },
});

const LabelText = ({ children, props }) => (
  <Text style={styles.labelText} {...props}>
    {children}
  </Text>
);

const ValueText = ({ children, props }) => (
  <Text style={styles.valueText} {...props}>
    {children}
  </Text>
);

export const MultiPageHeader = ({ documentName, patientName, patiendId }) => {
  const HeaderContent = () => (
    <>
      <LabelText>{documentName}</LabelText>
      <ValueText> | </ValueText>
      <LabelText>Patient name</LabelText>
      <ValueText>: {patientName}</ValueText>
      <ValueText> | </ValueText>
      <LabelText>Patient ID</LabelText>
      <ValueText>: {patiendId}</ValueText>
    </>
  );

  return (
    <View style={styles.header} render={({ pageNumber }) => pageNumber > 1 && <HeaderContent />} />
  );
};
