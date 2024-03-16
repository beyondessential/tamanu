import { Text, View } from '@react-pdf/renderer';
import { getDisplayDate } from '../getDisplayDate';
import React from 'react';
import { getCurrentDateString } from '../../dateTime';
import { CustomStyleSheet } from '../../renderPdf';
import { useLanguageContext } from '../../languageContext';

const styles = CustomStyleSheet.create({
  footer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    bottom: 25,
    left: 50,
    right: 50,
    color: '#888888',
    borderTop: '1px solid #888888',
    paddingTop: 2,
  },

  footerLeftContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  footerRightContent: {
    flexDirection: 'row',
    textAlign: 'right',
  },

  labelText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica-Bold',
  },

  valueText: {
    fontSize: 8,
    fontWeight: 400,
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

export const Footer = ({ printDate, printFacility, printedBy, style }) => {
  return (
    <View style={[styles().footer, style]} fixed>
      <View style={styles().footerLeftContent}>
        <LabelText>Print date: </LabelText>
        <ValueText>{getDisplayDate(printDate || getCurrentDateString())}</ValueText>
        {printFacility && (
          <>
            <ValueText> | </ValueText>
            <LabelText>Print facility: </LabelText>
            <ValueText>{printFacility}</ValueText>
          </>
        )}
        {printedBy && (
          <>
            <ValueText> | </ValueText>
            <LabelText>Printed by: </LabelText>
            <ValueText>{printedBy}</ValueText>
          </>
        )}
      </View>
      <View style={styles().footerRightContent}>
        <Text
          style={styles().valueText}
          render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  );
};
