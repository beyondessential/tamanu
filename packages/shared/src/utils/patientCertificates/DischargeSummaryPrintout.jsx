import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { CertificateHeader, Row, styles } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';

const infoBoxStyles = StyleSheet.create({
  infoCol: {
    border: '1 solid black',
    flex: 1,
    padding: 10,
  },
  labelCol: {
    border: '1 solid black',
    width: 114,
    padding: 10,
  },
  labelText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    fontWeight: 500,
  },
  infoText: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    fontWeight: 400,
  },
});

const InfoBox = ({ label, info }) => (
  <Row>
    <View style={infoBoxStyles.labelCol}>
      <Text style={infoBoxStyles.labelText}>{label}</Text>
    </View>
    <View style={infoBoxStyles.infoCol}>
      {info.map((item, index) => {
        return (
          <Text style={infoBoxStyles.infoText} key={index}>
            {item}
          </Text>
        );
      })}
    </View>
  </Row>
);

const PrimaryDiagnosesTable = ({ diagnoses }) => {};

export const DischargeSummaryPrintout = ({
  patientData,
  encounter,
  discharge,
  getLocalisation,
}) => {
  console.log(discharge);
  console.log(patientData);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection getLocalisation={getLocalisation} />
        </CertificateHeader>
        <PatientDetailsWithAddress patient={patientData} getLocalisation={getLocalisation} />
        <InfoBox label="Admission date" info={['1321321', '3432143215', '432143214']} />
      </Page>
    </Document>
  );
};
