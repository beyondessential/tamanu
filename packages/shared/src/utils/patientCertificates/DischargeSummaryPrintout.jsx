import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { CertificateHeader, styles } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from '@tamanu/constants';
import { EncounterDetailsExtended } from './printComponents/EncounterDetailsExtended';
import { Footer } from './printComponents/Footer';
import { P } from './Typography';

const borderStyle = '1 solid black';
const tableLabelWidth = 150;
const tablePadding = 10;

const generalStyles = StyleSheet.create({
  tableContainer: {
    marginVertical: 5,
  },
  sectionContainer: {
    marginVertical: 7,
  },
});

const TableContainer = props => <View style={generalStyles.tableContainer} {...props} />;
const SectionContainer = props => <View style={generalStyles.sectionContainer} {...props} />;

const infoBoxStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    border: borderStyle,
  },
  labelCol: {
    borderRight: borderStyle,
    width: tableLabelWidth,
    padding: tablePadding,
  },
  dataCol: {
    flex: 1,
    padding: tablePadding,
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

const InfoBoxRow = props => <View style={infoBoxStyles.row} {...props} />;
const InfoBoxLabelCol = props => <View style={infoBoxStyles.labelCol} {...props} />;
const InfoBoxDataCol = props => <View style={infoBoxStyles.dataCol} {...props} />;

const medicationsTableStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
  },
  tableBorder: {
    border: borderStyle,
  },
  titleCol: {
    width: tableLabelWidth,
    borderRight: borderStyle,
    padding: tablePadding,
  },
  labelCol: {
    borderRight: borderStyle,
    width: 71,
    padding: tablePadding,
  },
  dataCol: {
    flex: 1,
    padding: tablePadding,
  },
});

const MedicationsTableBorder = props => (
  <View style={[medicationsTableStyles.tableBorder, medicationsTableStyles.row]} {...props} />
);
const MedicationsTableTitleCol = props => (
  <View style={medicationsTableStyles.titleCol} {...props} />
);

const notesSectionStyles = StyleSheet.create({
  notesBox: {
    border: borderStyle,
    minHeight: 76,
    padding: 10,
  },
});

const extractOngoingConditions = patientConditions =>
  patientConditions.map(item => item?.diagnosis?.name);

const extractDiagnosesInfo = ({ diagnoses, getLocalisation }) => {
  const displayIcd10Codes = getLocalisation('features.displayIcd10CodesInDischargeSummary');
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
    return procedures.map(item => `${item?.procedureType?.name} (${item?.procedureType?.code})`);
  }
};

const InfoBox = ({ label, info }) => (
  <InfoBoxRow>
    <InfoBoxLabelCol>
      <Text style={infoBoxStyles.labelText}>{label}</Text>
    </InfoBoxLabelCol>
    <InfoBoxDataCol>
      {info.map((item, index) => {
        return (
          <Text style={infoBoxStyles.infoText} key={index}>
            {item}
          </Text>
        );
      })}
    </InfoBoxDataCol>
  </InfoBoxRow>
);

const DiagnosesTable = ({ title, diagnoses, getLocalisation }) => (
  <InfoBox label={title} info={extractDiagnosesInfo({ diagnoses, getLocalisation })} />
);

const ProceduresTable = ({ procedures, getLocalisation }) => (
  <InfoBox label="Procedures" info={extractProceduresInfo({ procedures, getLocalisation })} />
);

const NotesSection = ({ notes }) => (
  <View>
    <P bold fontSize={11} mb={3}>
      Discharge planning notes
    </P>
    <View style={notesSectionStyles.notesBox}>
      <Text style={infoBoxStyles.infoText}>{notes}</Text>
    </View>
  </View>
);

const MedicationsTableInfoBox = ({ label, info, hasBottomBorder = false }) => (
  <View style={{ ...medicationsTableStyles.row, borderBottom: hasBottomBorder ?? borderStyle }}>
    <View style={medicationsTableStyles.labelCol}>
      <Text style={infoBoxStyles.infoText}>{label}</Text>
    </View>
    <View style={medicationsTableStyles.dataCol}>
      {info.map((item, index) => {
        return (
          <Text style={infoBoxStyles.infoText} key={index}>
            {item}
          </Text>
        );
      })}
    </View>
  </View>
);

const MedicationsTable = ({ medications }) => {
  const currentMedications = medications.filter(m => !m.discontinued);
  const discontinuedMedications = medications.filter(m => m.discontinued);

  return (
    <MedicationsTableBorder>
      <MedicationsTableTitleCol>
        <Text style={infoBoxStyles.labelText}>Medications</Text>
      </MedicationsTableTitleCol>
      <View style={{ flexDirection: 'column', flex: 1 }}>
        <MedicationsTableInfoBox
          label="Current"
          info={currentMedications.map(item => item?.medication?.name)}
          hasBottomBorder={true}
        />
        <MedicationsTableInfoBox
          label="Discontinued"
          info={discontinuedMedications.map(item => item?.medication?.name)}
          hasBottomBorder={false}
        />
      </View>
    </MedicationsTableBorder>
  );
};

export const DischargeSummaryPrintout = ({
  patientData,
  encounter,
  discharge,
  patientConditions,
  certificateData,
  getLocalisation,
}) => {
  const { logo } = certificateData;
  const { diagnoses, procedures, medications } = encounter;
  const visibleDiagnoses = diagnoses.filter(
    ({ certainty }) => !DIAGNOSIS_CERTAINTIES_TO_HIDE.includes(certainty),
  );
  const primaryDiagnoses = visibleDiagnoses.filter(d => d.isPrimary);
  const secondaryDiagnoses = visibleDiagnoses.filter(d => !d.isPrimary);
  const notes = discharge?.note;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            certificateTitle="Patient discharge summary"
            letterheadConfig={certificateData}
            logoSrc={logo}
          />
        </CertificateHeader>
        <SectionContainer>
          <PatientDetailsWithAddress patient={patientData} getLocalisation={getLocalisation} />
        </SectionContainer>
        <SectionContainer>
          <EncounterDetailsExtended encounter={encounter} discharge={discharge} />
        </SectionContainer>
        <SectionContainer>
          {patientConditions.length > 0 && (
            <TableContainer>
              <InfoBox
                label="Ongoing conditions"
                info={extractOngoingConditions(patientConditions)}
              />
            </TableContainer>
          )}
          {primaryDiagnoses.length > 0 && (
            <TableContainer>
              <DiagnosesTable
                title="Primary diagnoses"
                diagnoses={primaryDiagnoses}
                getLocalisation={getLocalisation}
              />
            </TableContainer>
          )}
          {secondaryDiagnoses.length > 0 && (
            <TableContainer>
              <DiagnosesTable
                title="Secondary diagnoses"
                diagnoses={secondaryDiagnoses}
                getLocalisation={getLocalisation}
              />
            </TableContainer>
          )}
          {procedures.length > 0 && (
            <TableContainer>
              <ProceduresTable procedures={procedures} getLocalisation={getLocalisation} />
            </TableContainer>
          )}
          {medications.length > 0 && (
            <TableContainer>
              <MedicationsTable medications={medications} />
            </TableContainer>
          )}
        </SectionContainer>
        <SectionContainer>
          <NotesSection notes={notes} />
        </SectionContainer>
      </Page>
    </Document>
  );
};
