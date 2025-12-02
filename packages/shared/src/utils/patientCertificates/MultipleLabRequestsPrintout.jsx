import React from 'react';
import PropTypes from 'prop-types';

import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { styles, CertificateContent, CertificateHeader, Col, Row, Signature } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { P } from './Typography';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { FullLabRequestDetailsSection, SampleDetailsRow } from './LabRequestDetailsSection';
import { HorizontalRule } from './printComponents/HorizontalRule';
import { DoubleHorizontalRule } from './printComponents/DoubleHorizontalRule';

const textFontSize = 9;

const signingSectionStyles = StyleSheet.create({
  underlinedText: {
    textDecoration: 'underline',
  },
  signatureView: {
    paddingRight: 32,
  },
  disclaimerText: {
    fontStyle: 'italic',
    fontSize: 8,
  },
});

const labDetailsSectionStyles = StyleSheet.create({
  divider: {
    borderBottom: '2px solid black',
    marginVertical: '10px',
  },
  detailsContainer: {
    marginBottom: 5,
  },
});

const generalStyles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
});

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const LabRequestDetailsSection = ({ labRequests }) => (
  <View>
    <P bold fontSize={11} mb={3}>
      Lab request details
    </P>
    <HorizontalRule />
      {labRequests.map((request, index) =>  (
        <View key={request.id} style={labDetailsSectionStyles.detailsContainer}>
          <FullLabRequestDetailsSection request={request} />
          <HorizontalRule />
          <SampleDetailsRow request={request} />
          {index < labRequests.length - 1 && <View style={labDetailsSectionStyles.divider} />}
        </View>
      ))}
    <DoubleHorizontalRule />
  </View>
);

const LabRequestSigningSection = ({ getTranslation }) => {
  const BaseSigningSection = ({ title }) => (
    <View style={{ flexDirection: 'column' }}>
      <P bold style={signingSectionStyles.underlinedText} fontSize={9}>
        {title}
      </P>
      <View style={signingSectionStyles.signatureView}>
        <Signature text="Signed" fontSize={textFontSize} lineThickness={0.5} />
        <Signature text="Date" fontSize={textFontSize} lineThickness={0.5} />
      </View>
    </View>
  );

  return (
    <View>
      <Row>
        <Col>
          <BaseSigningSection
            title={getTranslation('general.localisedField.clinician.label', 'Clinician')}
          />
        </Col>
        <Col>
          <BaseSigningSection title="Patient" />
          <Text style={signingSectionStyles.disclaimerText}>
            Patient to sign if required, according to local regulations
          </Text>
        </Col>
      </Row>
    </View>
  );
};

const MultipleLabRequestsPrintoutComponent = React.memo(
  ({
    patientData,
    labRequests,
    encounter,
    certificateData,
    getLocalisation,
    getTranslation,
    getSetting,
  }) => {
    const { logo } = certificateData;
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <CertificateHeader>
            <LetterheadSection
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle="Lab request"
            />
            <SectionContainer>
              <PatientDetailsWithBarcode
                patient={patientData}
                getLocalisation={getLocalisation}
                getSetting={getSetting}
              />
            </SectionContainer>
            <SectionContainer>
              <EncounterDetails encounter={encounter} />
            </SectionContainer>
          </CertificateHeader>
          <CertificateContent>
            <SectionContainer>
              <LabRequestDetailsSection labRequests={labRequests} />
            </SectionContainer>
            <SectionContainer>
              <LabRequestSigningSection getTranslation={getTranslation} labRequests={labRequests} />
            </SectionContainer>
          </CertificateContent>
        </Page>
      </Document>
    );
  },
);

export const MultipleLabRequestsPrintout = withLanguageContext(
  MultipleLabRequestsPrintoutComponent,
);

MultipleLabRequestsPrintout.propTypes = {
  patientData: PropTypes.object.isRequired,
  village: PropTypes.object.isRequired,
  encounter: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
