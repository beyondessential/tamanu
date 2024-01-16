import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { CertificateHeader, Row, styles } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from '@tamanu/constants';

const generalStyles = StyleSheet.create({
  tableContainer: {
    marginVertical: 5,
  },
});

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
    fontSize: 10,
    fontWeight: 500,
  },
  infoText: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    fontWeight: 400,
  },
});

const medicationsTableStyles = StyleSheet.create({
  flexCol: {
    flex: 1,
  },
  innerLabelCol: {
    border: '1 solid black',
    width: 71,
    padding: 10,
  },
});

const notesSectionStyles = StyleSheet.create({
  notesBox: {
    border: '1 solid black',
    height: 76,
  },
});

const TableContainer = props => <View style={generalStyles.tableContainer} {...props} />;

const extractDiagnosesInfo = ({ diagnoses, getLocalisation }) => {
  const displayIcd10Codes = getLocalisation('features.displayIcd10CodesInDischargeSummary');
  console.log(diagnoses);
  if (!displayIcd10Codes) {
    return diagnoses.map(item => item?.diagnosis?.name);
  } else {
    return diagnoses.map(item => `${item?.diagnosis?.name} (${item?.diagnosis?.code})`);
  }
};

const extractProceduresInfo = ({ procedures, getLocalisation }) => {
  const displayProcedureCodes = getLocalisation('features.displayProcedureCodesInDischargeSummary');
  if (!displayProcedureCodes) {
    return procedures.map(item => item?.procedureType?.name);
  } else {
    return procedures.map(item => `${item?.diagnosis?.name} (${item?.procedureType?.code})`);
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

const ProceduresTable = ({ procedures, getLocalisation }) => (
  <InfoBox label="Procedures" info={extractProceduresInfo({ procedures, getLocalisation })} />
);

const NotesSection = () => <View style={notesSectionStyles.notesBox} />;

const MedicationsTable = ({ medications }) => {
  const currentMedications = medications.filter(m => !m.discontinued);
  const discontinuedMedications = medications.filter(m => m.discontinued);

  console.log('current', currentMedications);

  return (
    <Row>
      <View style={infoBoxStyles.labelCol}>
        <Text style={infoBoxStyles.labelText}>Medications</Text>
      </View>
      <View style={medicationsTableStyles.flexCol}>
        <Row>
          <View style={medicationsTableStyles.innerLabelCol}>
            <Text style={infoBoxStyles.infoText}>Current</Text>
          </View>
          <View style={infoBoxStyles.infoCol}>
            {currentMedications.map((item, index) => (
              <Text style={infoBoxStyles.infoText} key={index}>
                {item?.medication?.name}
              </Text>
            ))}
          </View>
        </Row>
        <Row>
          <View style={medicationsTableStyles.innerLabelCol}>
            <Text style={infoBoxStyles.infoText}>Discontinued</Text>
          </View>
          <View style={infoBoxStyles.infoCol}>
            {discontinuedMedications.map((item, index) => (
              <Text style={infoBoxStyles.infoText} key={index}>
                {item?.medication?.name}
              </Text>
            ))}
          </View>
        </Row>
      </View>
    </Row>
  );
};

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
  console.log('medications', medications);
  const primaryDiagnoses = visibleDiagnoses.filter(d => d.isPrimary);
  const secondaryDiagnoses = visibleDiagnoses.filter(d => !d.isPrimary);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection getLocalisation={getLocalisation} />
        </CertificateHeader>
        <PatientDetailsWithAddress patient={patientData} getLocalisation={getLocalisation} />
        <TableContainer>
          <DiagnosesTable
            title="Primary diagnoses"
            diagnoses={primaryDiagnoses}
            getLocalisation={getLocalisation}
          />
        </TableContainer>
        <TableContainer>
          <DiagnosesTable
            title="Secondary diagnoses"
            diagnoses={secondaryDiagnoses}
            getLocalisation={getLocalisation}
          />
        </TableContainer>
        <TableContainer>
          <ProceduresTable procedures={procedures} getLocalisation={getLocalisation} />
        </TableContainer>
        <TableContainer>
          <MedicationsTable medications={medications} />
        </TableContainer>
        <NotesSection />
      </Page>
    </Document>
  );
};
