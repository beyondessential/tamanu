import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles, Box } from '../patientCertificates/Layout';
import { HandoverHeaderSection } from './HandoverHeaderSection';
import { HandoverPatient } from './HandoverPatient';

export const HandoverNotesPDF = ({ handoverNotes = [], area, logoSrc, getLocalisation }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <HandoverHeaderSection area={area} getLocalisation={getLocalisation} logoSrc={logoSrc} />
      <Box mb={0}>
        {handoverNotes.map(({ patient, diagnosis, notes, location, createdAt }) => (
          <HandoverPatient
            key={`patient-notes-${patient.displayId}`}
            patient={patient}
            location={location}
            createdAt={createdAt}
            diagnosis={diagnosis}
            notes={notes}
            getLocalisation={getLocalisation}
          />
        ))}
      </Box>
    </Page>
  </Document>
);
