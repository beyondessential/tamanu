import { Document, Page, StyleSheet, View } from '@react-pdf/renderer';
import React from 'react';
import { CertificateHeader, Col, Signature, styles } from './Layout';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { Table } from './Table';
import { DataSection } from './printComponents/DataSection';
import { DataItem } from './printComponents/DataItem';
import { getDisplayDate } from './getDisplayDate';
import { getCurrentDateString } from '../dateTime';
import { LetterheadSection } from './LetterheadSection';

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
  },
  {
    key: 'prescription',
    title: 'Instructions',
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

const generalStyles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
});

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const PrescriptionsSection = ({ prescriptions, prescriber, encounter, getLocalisation }) => {
  return (
    <View>
      <DataSection hideBottomRule title="Prescription details">
        <Col>
          <DataItem label="Date" value={getDisplayDate(getCurrentDateString())} />
          <DataItem label="Prescriber" value={prescriber?.displayName} />
        </Col>
        <Col>
          <DataItem label="Prescriber ID" value={prescriber?.displayId ?? 'n/a'} />
          <DataItem label="Facility" value={encounter?.location?.facility?.name} />
        </Col>
      </DataSection>
      <View style={prescriptonSectionStyles.tableContainer}>
        <Table columns={columns} data={prescriptions} getLocalisation={getLocalisation} />
      </View>
    </View>
  );
};

const PrescriptionSigningSection = () => (
  <View>
    <Signature text="Signed" />
    <Signature text="Date" />
  </View>
);

export const PrescriptionPrintout = ({
  patientData,
  prescriptions,
  prescriber,
  encounterData,
  certificateData,
  getLocalisation,
}) => {
  console.log(prescriber);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={certificateData.logo}
            certificateTitle="Prescription"
          />
          <PatientDetailsWithBarcode patient={patientData} getLocalisation={getLocalisation} />
        </CertificateHeader>
        <SectionContainer>
          <PrescriptionsSection
            prescriptions={prescriptions}
            prescriber={prescriber}
            encounter={encounterData}
            getLocalisation={getLocalisation}
          />
        </SectionContainer>
        <SectionContainer>
          <PrescriptionSigningSection />
        </SectionContainer>
      </Page>
    </Document>
  );
};
