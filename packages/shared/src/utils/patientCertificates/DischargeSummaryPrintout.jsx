import { Document, Page } from '@react-pdf/renderer';
import React from 'react';
import { CertificateHeader, styles } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import {PatientDetailsWithAddress} from './printComponents/PatientDetailsWithAddress';

export const DischargeSummaryPrintout = ({ patientData, encounter, discharge, getLocalisation }) => {
  console.log(discharge);
  console.log(patientData);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection getLocalisation={getLocalisation} />
        </CertificateHeader>
        <PatientDetailsWithAddress patient={patientData} getLocalisation={getLocalisation} />
      </Page>
    </Document>
  );
};
