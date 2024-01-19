import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { CertificateContent, CertificateHeader, Col, Signature, styles } from './Layout';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { Table } from './Table';
import { DataSection } from './printComponents/DataSection';
import { DataItem } from './printComponents/DataItem';
import { getDisplayDate } from './getDisplayDate';
import { getCurrentDateString } from '../dateTime';
import { LetterheadSection } from './LetterheadSection';
import { Footer } from './printComponents/Footer';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { P } from './Typography';

// Copied from web constants
const DRUG_ROUTE_VALUE_TO_LABEL = {
  dermal: 'Dermal',
  ear: 'Ear',
  eye: 'Eye',
  intramuscular: 'IM',
  intravenous: 'IV',
  inhaled: 'Inhaled',
  nasal: 'Nasal',
  oral: 'Oral',
  rectal: 'Rectal',
  subcutaneous: 'S/C',
  sublingual: 'Sublingual',
  topical: 'Topical',
  vaginal: 'Vaginal',
};

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
    accessor: ({ route }) => DRUG_ROUTE_VALUE_TO_LABEL[route] || '',
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

const PrescriptionsSection = ({ prescriptions, prescriber, facility, getLocalisation }) => {
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
        <Table columns={columns} data={prescriptions} getLocalisation={getLocalisation} />
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

export const PrescriptionPrintout = ({
  patientData,
  prescriptions,
  prescriber,
  certificateData,
  facility,
  getLocalisation,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <MultiPageHeader
          documentName="Prescription"
          patientName={getName(patientData)}
          patiendId={patientData?.displayId}
        />
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
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
            />
          </SectionContainer>
          <SectionContainer>
            <NotesSection />
          </SectionContainer>
          <SectionContainer>
            <PrescriptionSigningSection />
          </SectionContainer>
        </CertificateContent>
        <Footer />
      </Page>
    </Document>
  );
};
