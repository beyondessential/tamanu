import { Text, View } from '@react-pdf/renderer';
import React from 'react';
import { CustomStyleSheet } from '../../renderPdf';
import { useLanguageContext } from '../../languageContext';

const styles = CustomStyleSheet.create({
  header: {
    flexDirection: 'row',
    display: 'flex',
    alignSelf: 'flex-end',
    marginBottom: 20,
  },

  labelText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica-Bold',
    color: '#888888',
  },

  valueText: {
    fontSize: 8,
    fontWeight: 400,
    color: '#888888',
  },
});

const LabelText = ({ children, props }) => {
  const { language } = useLanguageContext();
  return (
    <Text style={styles(language).labelText} {...props}>
      {children}
    </Text>
  );
};

const ValueText = ({ children, props }) => (
  <Text style={styles().valueText} {...props}>
    {children}
  </Text>
);

export const MultiPageHeader = ({ documentName, patientName, patientId }) => {
  const HeaderContent = () => (
    <>
      <LabelText>{`${documentName} `}</LabelText>
      <ValueText>|</ValueText>
      <LabelText> Patient name</LabelText>
      <ValueText>: {patientName} </ValueText>
      <ValueText>|</ValueText>
      <LabelText> Patient ID</LabelText>
      <ValueText>: {patientId}</ValueText>
    </>
  );

  return (
    <View
      style={styles().header}
      render={({ pageNumber }) => pageNumber > 1 && <HeaderContent />}
      fixed
    />
  );
};
