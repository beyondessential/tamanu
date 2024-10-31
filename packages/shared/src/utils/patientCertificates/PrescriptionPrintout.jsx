import { Document, StyleSheet, View } from '@react-pdf/renderer';
import React from 'react';

import { DRUG_ROUTE_LABELS } from '@tamanu/constants';

import { CertificateContent, CertificateHeader, Col, Signature, styles } from './Layout';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { Table } from './Table';
import { DataSection } from './printComponents/DataSection';
import { DataItem } from './printComponents/DataItem';
import { getDisplayDate } from './getDisplayDate';
import { getCurrentDateString } from '../dateTime';
import { LetterheadSection } from './LetterheadSection';
import { P } from './Typography';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';

const columns = [
  {
    key: 'medication',
    title: 'Medication',
    accessor: ({ medication }) => (medication || {}).name,
    customStyles: { minWidth: 100 },
  },
  {
    key: 'prescription',
    title: 'Instructions',
    customStyles: { minWidth: 100 },
  },
  {
    key: 'route',
    title: 'Route',
    accessor: ({ route }) => DRUG_ROUTE_LABELS[route] || '',
  },
  {
    key: 'quantity',
    title: 'Quantity',
  },
  {
    key: 'repeats',
    title: 'Repeats',
  },
];

const prescriptonSectionStyles = StyleSheet.create({
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

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const PrescriptionsSection = ({
  prescriptions,
  prescriber,
  facility,
  getLocalisation,
  getSetting,
}) => {
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
      <View style={prescriptonSectionStyles.tableContainer}>
        <Table
          columns={columns}
          data={prescriptions}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
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
        <CertificateContent>
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
