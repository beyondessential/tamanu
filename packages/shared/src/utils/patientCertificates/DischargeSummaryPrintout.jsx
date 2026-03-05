import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';


import { DIAGNOSIS_CERTAINTIES_TO_HIDE, DRUG_ROUTE_LABELS } from '@tamanu/constants';

import { CertificateHeader, styles } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { P } from './Typography';
import { Table } from './Table';
import { EncounterDetailsExtended } from './printComponents/EncounterDetailsExtended';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { withDateTimeContext } from '../pdf/withDateTimeContext';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '../medication';

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
    fontSize: 10,
  },
  infoText: {
    fontSize: 10,
  },
});

const InfoBoxRow = props => <View style={infoBoxStyles.row} {...props} />;
const InfoBoxLabelCol = props => <View style={infoBoxStyles.labelCol} {...props} />;
const InfoBoxDataCol = props => <View style={infoBoxStyles.dataCol} {...props} />;

const notesSectionStyles = StyleSheet.create({
  notesBox: {
    border: borderStyle,
    minHeight: 76,
    padding: 10,
  },
});

const extractOngoingConditions = patientConditions =>
  patientConditions.map(item => item?.diagnosis?.name);

const extractDiagnosesInfo = ({ diagnoses, getSetting }) => {
  const displayIcd10Codes = getSetting('features.displayIcd10CodesInDischargeSummary');
  if (!displayIcd10Codes) {
    return diagnoses.map(item => item?.diagnosis?.name);
  } else {
    return diagnoses.map(item => `${item?.diagnosis?.name} (${item?.diagnosis?.code})`);
  }
};

const extractProceduresInfo = ({ procedures, getSetting }) => {
  const displayProcedureCodes = getSetting('features.displayProcedureCodesInDischargeSummary');
  if (!displayProcedureCodes) {
    return procedures.map(item => item?.procedureType?.name);
  } else {
    return procedures.map(item => `${item?.procedureType?.name} (${item?.procedureType?.code})`);
  }
};

const InfoBox = ({ label, info }) => (
  <InfoBoxRow>
    <InfoBoxLabelCol>
      <Text bold style={infoBoxStyles.labelText}>
        {label}
      </Text>
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

const DiagnosesTable = ({ title, diagnoses, getSetting }) => (
  <InfoBox label={title} info={extractDiagnosesInfo({ diagnoses, getSetting })} />
);

const ProceduresTable = ({ procedures, getSetting }) => (
  <InfoBox label="Procedures" info={extractProceduresInfo({ procedures, getSetting })} />
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

const columns = (getTranslation, getEnumTranslation) => [
  {
    key: 'medication',
    title: getTranslation('pdf.table.column.medication', 'Medication'),
    accessor: ({ medication, notes }) => (
      <View>
        <Text>{medication?.name + `\n`}</Text>
        <Text style={{ fontFamily: 'Helvetica-Oblique' }}>{notes}</Text>
      </View>
    ),
    customStyles: { minWidth: 180 },
  },
  {
    key: 'dose',
    title: getTranslation('pdf.table.column.dose', 'Dose'),
    accessor: medication => {
      return (
        <Text>
          {getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation)}
          {medication?.isPrn && ` ${getTranslation('medication.table.prn', 'PRN')}`}
        </Text>
      );
    },
  },
  {
    key: 'frequency',
    title: getTranslation('pdf.table.column.frequency', 'Frequency'),
    accessor: ({ frequency }) => getTranslatedFrequency(frequency, getTranslation),
    customStyles: { minWidth: 30 },
  },
  {
    key: 'route',
    title: getTranslation('pdf.table.column.route', 'Route'),
    accessor: ({ route }) => getEnumTranslation(DRUG_ROUTE_LABELS, route),
  },
  {
    key: 'quantity',
    title: getTranslation('pdf.table.column.quantity', 'Quantity'),
    accessor: ({ quantity }) => quantity,
  },
  {
    key: 'repeats',
    title: getTranslation('pdf.table.column.repeats', 'Repeats'),
    accessor: ({ repeats }) => repeats || 0,
  },
];

const DischargeSummaryPrintoutComponent = ({
  patientData,
  encounter,
  discharge,
  patientConditions,
  certificateData,
  getSetting,
}) => {
  const { getTranslation, getEnumTranslation } = useLanguageContext();
  const { logo } = certificateData;
  const { diagnoses, procedures, medications } = encounter;

  const visibleMedications = medications
    .filter(
      m =>
        m.encounterPrescription?.isSelectedForDischarge && !m.medication.referenceDrug.isSensitive,
    )
    .sort((a, b) => a.medication.name.localeCompare(b.medication.name));
  const visibleDiagnoses = diagnoses.filter(
    ({ certainty }) => !DIAGNOSIS_CERTAINTIES_TO_HIDE.includes(certainty),
  );
  const primaryDiagnoses = visibleDiagnoses.filter(d => d.isPrimary);
  const secondaryDiagnoses = visibleDiagnoses.filter(d => !d.isPrimary);
  const notes = discharge?.note;
  const { name: facilityName, address: facilityAddress, town: facilityTown } = discharge.address;

  // change header if facility details are present in discharge
  if (facilityName && facilityAddress && certificateData?.title) {
    certificateData = {
      ...certificateData,
      title: facilityName,
      subTitle: facilityTown ? `${facilityAddress}, ${facilityTown}` : facilityAddress,
    };
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection
            certificateTitle="Patient discharge summary"
            letterheadConfig={certificateData}
            logoSrc={logo}
          />
        </CertificateHeader>
        <SectionContainer>
          <PatientDetailsWithAddress
            patient={patientData}
            getSetting={getSetting}
          />
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
                getSetting={getSetting}
              />
            </TableContainer>
          )}
          {secondaryDiagnoses.length > 0 && (
            <TableContainer>
              <DiagnosesTable
                title="Secondary diagnoses"
                diagnoses={secondaryDiagnoses}
                getSetting={getSetting}
              />
            </TableContainer>
          )}
          {procedures.length > 0 && (
            <TableContainer>
              <ProceduresTable procedures={procedures} getSetting={getSetting} />
            </TableContainer>
          )}
          {visibleMedications.length > 0 && (
            <TableContainer>
              <Table
                data={visibleMedications}
                columns={columns(getTranslation, getEnumTranslation)}
                getSetting={getSetting}
                columnStyle={{ padding: '10px 5px' }}
              />
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

export const DischargeSummaryPrintout = withLanguageContext(
  withDateTimeContext(DischargeSummaryPrintoutComponent),
);
