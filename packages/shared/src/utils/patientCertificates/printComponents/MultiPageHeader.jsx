import { StyleSheet, View, Text } from '@react-pdf/renderer';
import React from 'react';
import { flatten } from '../../pdf/flattenStyles';
import { useLanguageContext } from '../../pdf/languageContext';

export const useTextStyles = styles => {
  const { makeIntlStyleSheet } = useLanguageContext();
  const mergedStyle = flatten(styles);
  return makeIntlStyleSheet(mergedStyle);
};

export const MultiPageHeader = ({ documentName, documentSubname, patientName, patientId }) => {
  const { getTranslation, pdfFontBold, pdfFont } = useLanguageContext();

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      display: 'flex',
      alignSelf: 'flex-end',
      marginBottom: 20,
    },

    labelText: {
      fontSize: 8,
      fontFamily: pdfFontBold,
      fontWeight: 700,
      color: '#888888',
    },

    valueText: {
      fontSize: 8,
      fontFamily: pdfFont,
      fontWeight: 400,
      color: '#888888',
    },
  });

  const valueStyles = useTextStyles(styles.valueText);
  const labelStyles = useTextStyles(styles.labelText);

  const ValueText = props => <Text style={valueStyles} {...props} />;
  const LabelText = props => <Text style={labelStyles} {...props} />;

  const HeaderContent = () => (
    <>
      <LabelText>{`${documentName} `}</LabelText>
      {documentSubname && (
        <>
          <ValueText>|</ValueText>
          <LabelText> {documentSubname} </LabelText>
        </>
      )}
      <ValueText>|</ValueText>
      <LabelText> {getTranslation('general.patientName.label', 'Patient name')}</LabelText>
      <ValueText>: {patientName} </ValueText>
      <ValueText>|</ValueText>
      <LabelText> {getTranslation('general.patientId.label', 'Patient ID')}</LabelText>
      <ValueText>: {patientId}</ValueText>
    </>
  );

  return (
    <View
      style={styles.header}
      render={({ pageNumber }) => pageNumber > 1 && <HeaderContent />}
      fixed
    />
  );
};
