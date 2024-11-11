import { StyleSheet, View } from '@react-pdf/renderer';
import React from 'react';
import { formatShort, getCurrentDateString } from '../../dateTime';
import { Text } from '../../pdf/Text';
import { useLanguageContext } from '../../pdf/languageContext';

const styles = StyleSheet.create({
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
    fontFamily: 'Helvetica',
  },
});

const LabelText = ({ children, ...props }) => (
  <Text style={styles.labelText} {...props}>
    {children}
  </Text>
);

const ValueText = ({ children, ...props }) => (
  <Text style={styles.valueText} {...props}>
    {children}
  </Text>
);

export const Footer = ({ printDate, printFacility, printedBy, style }) => {
  const { getTranslation } = useLanguageContext();
  return (
    <View style={[styles.footer, style]} fixed>
      <View style={styles.footerLeftContent}>
        <LabelText>{getTranslation('pdf.footer.printDate.label', 'Print date')}: </LabelText>
        <ValueText>{formatShort(printDate || getCurrentDateString())} </ValueText>
        {printFacility && (
          <>
            <ValueText> |</ValueText>
            <LabelText>
              {getTranslation('pdf.footer.printFacility.label', 'Print facility')}:{' '}
            </LabelText>
            <ValueText>{printFacility} </ValueText>
          </>
        )}
        {printedBy && (
          <>
            <ValueText> |</ValueText>
            <LabelText>{getTranslation('pdf.footer.printedBy.label', 'Printed by')}: </LabelText>
            <ValueText>{printedBy}</ValueText>
          </>
        )}
      </View>
      <View style={styles.footerRightContent}>
        <Text
          style={styles.valueText}
          render={({ pageNumber, totalPages }) =>
            getTranslation('pdf.pagination', ':currentPage of :totalPages', {
              currentPage: pageNumber,
              totalPages,
            })
          }
        />
      </View>
    </View>
  );
};
