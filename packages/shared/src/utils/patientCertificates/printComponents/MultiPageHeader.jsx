import { StyleSheet, View } from '@react-pdf/renderer';
import React from 'react';
import { Text } from '../../pdf/Text';
import { useLanguageContext } from '../../pdf/languageContext';
import { flatten } from 'lodash';

const styles = StyleSheet.create({
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
    fontFamily: 'Helvetica',
    color: '#888888',
  },
});

// TODO: put in context
export const useTextStyles = styles => {
  const { makeIntlStyleSheet } = useLanguageContext();
  const mergedStyle = flatten(styles);
  return makeIntlStyleSheet(mergedStyle);
};

export const MultiPageHeader = ({ documentName, patientName, patientId }) => {
  const valueStyles = useTextStyles(styles.valueText);
  const labelStyles = useTextStyles(styles.labelText);

  const ValueText = props => <Text styles={valueStyles} {...props} />;
  const LabelText = props => <Text styles={labelStyles} {...props} />;
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
      style={styles.header}
      render={({ pageNumber }) => pageNumber > 1 && <HeaderContent />}
      fixed
    />
  );
};
