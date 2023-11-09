import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles, Box } from '../patientCertificates/Layout';
import { HandoverHeaderSection } from './HandoverHeaderSection';
import { HandoverPatient } from './HandoverPatient';

export const HandoverNotesPDF = ({
  handoverNotes = [],
  locationGroupName,
  logoSrc,
  getLocalisation,
  letterheadConfig,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <HandoverHeaderSection
        letterheadConfig={letterheadConfig}
        locationGroupName={locationGroupName}
        logoSrc={logoSrc}
      />
      <Box mb={0}>
        {handoverNotes.map(
          ({ patient, diagnosis, notes, location, createdAt, isEdited, arrivalDate }) => (
            <HandoverPatient
              key={`patient-notes-${patient.displayId}`}
              patient={patient}
              location={location}
              createdAt={createdAt}
              diagnosis={diagnosis}
              arrivalDate={arrivalDate}
              notes={notes}
              isEdited={isEdited}
              getLocalisation={getLocalisation}
            />
          ),
        )}
      </Box>
    </Page>
  </Document>
);
