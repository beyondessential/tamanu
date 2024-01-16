import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { CertificateHeader, Row, styles } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from '@tamanu/constants';

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

const extractDiagnosesInfo = ({ diagnoses, getLocalisation }) => {
  const displayIcd10Codes = getLocalisation('features.displayIcd10CodesInDischargeSummary');
  console.log(diagnoses);
  if (!displayIcd10Codes) {
    return diagnoses.map(item => item?.diagnosis?.name);
  } else {
    return diagnoses.map(item => `${item?.diagnosis?.name} (${item?.diagnosis?.code})`);
  }
};

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

const DiagnosesTable = ({ title, diagnoses, getLocalisation }) => (
  <InfoBox label={title} info={extractDiagnosesInfo({ diagnoses, getLocalisation })} />
);

export const DischargeSummaryPrintout = ({
  patientData,
  encounter,
  discharge,
  getLocalisation,
}) => {
  const {
    diagnoses,
    procedures,
    medications,
    startDate,
    endDate,
    location,
    examiner,
    reasonForEncounter = 'N/A',
  } = encounter;
  console.log(getLocalisation);
  const visibleDiagnoses = diagnoses.filter(
    ({ certainty }) => !DIAGNOSIS_CERTAINTIES_TO_HIDE.includes(certainty),
  );
  console.log('encounter', encounter);
  console.log('diagnoses', diagnoses);
  const primaryDiagnoses = visibleDiagnoses.filter(d => d.isPrimary);
  console.log('primary', primaryDiagnoses);
  const secondaryDiagnoses = visibleDiagnoses.filter(d => !d.isPrimary);
  console.log('secondary', secondaryDiagnoses);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection getLocalisation={getLocalisation} />
        </CertificateHeader>
        <PatientDetailsWithAddress patient={patientData} getLocalisation={getLocalisation} />
        <DiagnosesTable title="Primary diagnoses" diagnoses={primaryDiagnoses} getLocalisation={getLocalisation} />
        <DiagnosesTable title="Secondary diagnoses" diagnoses={secondaryDiagnoses} getLocalisation={getLocalisation} />
      </Page>
    </Document>
  );
};
