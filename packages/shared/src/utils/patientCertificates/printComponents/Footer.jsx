import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { getDisplayDate } from '../getDisplayDate';
import React from 'react';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    bottom: 16,
    left: 50,
    right: 50,
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

export const Footer = ({ printDate, printFacility, printedBy }) => {
  return (
    <View style={styles.footer}>
      <View style={styles.footerLeftContent}>
        <LabelText>Print date: </LabelText>
        <ValueText>{getDisplayDate(printDate)}</ValueText>
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
      <View style={styles.footerRightContent}>
        <Text
          style={styles.valueText}
          render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  );
};
