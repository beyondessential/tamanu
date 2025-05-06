import { Document, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';

import { CertificateContent, CertificateHeader, Col, Signature, styles } from './Layout';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { Table } from './Table';
import { DataSection } from './printComponents/DataSection';
import { DataItem } from './printComponents/DataItem';
import { getDisplayDate } from './getDisplayDate';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { LetterheadSection } from './LetterheadSection';
import { P } from './Typography';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { getDose, getTranslatedFrequency } from '../medication';

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
    accessor: (medication) => {
      return (
        <Text>
          {getDose(medication, getTranslation, getEnumTranslation)}
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
    title: getTranslation('pdf.table.column.repeat', 'Repeat'),
    accessor: ({ repeats }) => repeats || 0,
  },
];

const prescriptionSectionStyles = StyleSheet.create({
  tableContainer: {
    marginTop: 12,
  },
});

const notesSectionStyles = StyleSheet.create({
  notesContainer: {
    border: '1px solid black',
    height: 69,
  },
});

const signingSectionStyles = StyleSheet.create({
  container: {
    marginTop: 22,
  },
});

const generalStyles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
});

const SectionContainer = (props) => <View style={generalStyles.container} {...props} />;

const PrescriptionsSection = ({
  prescriptions,
  prescriber,
  facility,
  getLocalisation,
  getSetting,
}) => {
  const { getTranslation, getEnumTranslation } = useLanguageContext();
  return (
    <View>
      <DataSection hideBottomRule title="Prescription details">
        <Col>
          <DataItem label="Date" value={getDisplayDate(getCurrentDateString())} />
          <DataItem label="Prescriber" value={prescriber?.displayName} />
        </Col>
        <Col>
          <DataItem label="Prescriber ID" value={prescriber?.displayId ?? 'n/a'} />
          <DataItem label="Facility" value={facility?.name} />
        </Col>
      </DataSection>
      <View style={prescriptionSectionStyles.tableContainer}>
        <Table
          columns={columns(getTranslation, getEnumTranslation)}
          data={prescriptions}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
          columnStyle={{ padding: '8px 7px' }}
        />
      </View>
    </View>
  );
};

const PrescriptionSigningSection = () => (
  <View style={signingSectionStyles.container}>
    <Signature fontSize={9} lineThickness={0.5} text="Signed" />
    <Signature fontSize={9} lineThickness={0.5} text="Date" />
  </View>
);

const NotesSection = () => (
  <View>
    <P bold fontSize={11} mb={3}>
      Notes
    </P>
    <View style={notesSectionStyles.notesContainer} />
  </View>
);

const PrescriptionPrintoutComponent = ({
  patientData,
  prescriptions,
  prescriber,
  certificateData,
  facility,
  getLocalisation,
  getSetting,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection
            letterheadConfig={certificateData}
            logoSrc={certificateData.logo}
            certificateTitle="Prescription"
          />
          <SectionContainer>
            <PatientDetailsWithBarcode patient={patientData} getLocalisation={getLocalisation} />
          </SectionContainer>
        </CertificateHeader>
        <CertificateContent style={{ margin: 0 }}>
          <SectionContainer>
            <PrescriptionsSection
              prescriptions={prescriptions}
              prescriber={prescriber}
              facility={facility}
              getLocalisation={getLocalisation}
              getSetting={getSetting}
            />
          </SectionContainer>
          <SectionContainer>
            <NotesSection />
          </SectionContainer>
          <SectionContainer>
            <PrescriptionSigningSection />
          </SectionContainer>
        </CertificateContent>
      </Page>
    </Document>
  );
};

export const PrescriptionPrintout = withLanguageContext(PrescriptionPrintoutComponent);
