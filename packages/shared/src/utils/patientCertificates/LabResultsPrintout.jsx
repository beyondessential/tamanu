import React from 'react';

import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { styles, CertificateContent, CertificateHeader} from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';

const generalStyles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
});

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const LabResultsPrintoutComponent = React.memo(
  ({ patientData, encounter, certificateData, getLocalisation, getSetting }) => {
    const { logo } = certificateData;
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <CertificateHeader>
            <LetterheadSection
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle="Lab results" 
            />
            <SectionContainer>
              <PatientDetailsWithBarcode patient={patientData} getLocalisation={getLocalisation} getSetting={getSetting} />
            </SectionContainer>
            <SectionContainer>
              <EncounterDetails encounter={encounter} hideLocation />
            </SectionContainer>
          </CertificateHeader>
          <CertificateContent>
          </CertificateContent>
        </Page>
      </Document>
    );
  },
);

export const LabResultsPrintout = withLanguageContext(
  LabResultsPrintoutComponent,
);
