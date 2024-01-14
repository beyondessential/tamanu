import { Document, Page } from '@react-pdf/renderer';
import React from 'react';
import { styles } from './Layout';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { Table } from './Table';

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

export const PrescriptionPrintout = ({
  patientData,
  prescriptions,
  encounterData,
  certificateData,
  getLocalisation,
}) => {
  console.log(prescriptions);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PatientDetailsWithBarcode patient={patientData} getLocalisation={getLocalisation} />
        <Table columns={columns} data={prescriptions} getLocalisation={getLocalisation} />
      </Page>
    </Document>
  );
};
