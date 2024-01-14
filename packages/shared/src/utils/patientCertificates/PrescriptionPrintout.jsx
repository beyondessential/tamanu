import { Document, Page } from '@react-pdf/renderer';
import React from 'react';
import { styles } from './Layout';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';

export const PrescriptionPrintout = ({ patientData, prescriptionData, encounterData, certificateData, getLocalisation }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PatientDetailsWithBarcode patient={patientData} getLocalisation={getLocalisation} /> 
      </Page>
    </Document>
  );
};
