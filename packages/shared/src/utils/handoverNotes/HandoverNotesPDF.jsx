import React from 'react';
import { Document } from '@react-pdf/renderer';
import { Box, styles } from '../patientCertificates/Layout';
import { HandoverHeaderSection } from './HandoverHeaderSection';
import { HandoverPatient } from './HandoverPatient';
import { withLanguageContext } from '../pdf/languageContext';
import { withDateTimeContext } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';

const HandoverNotesPDFComponent = ({
  handoverNotes = [],
  locationGroupName,
  logoSrc,
  getSetting,
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
              getSetting={getSetting}
            />
          ),
        )}
      </Box>
    </Page>
  </Document>
);

export const HandoverNotesPDF = withLanguageContext(
  withDateTimeContext(HandoverNotesPDFComponent),
);
