import React from 'react';
import PropTypes from 'prop-types';

import { Document, Page, StyleSheet, View, Text } from '@react-pdf/renderer';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { styles, CertificateContent, CertificateHeader, Col, Row, Signature } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { P } from './Typography';
import { DataItem } from './printComponents/DataItem';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { HorizontalRule } from './printComponents/HorizontalRule';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { getDisplayDate } from './getDisplayDate';

const DATE_TIME_FORMAT = 'dd/MM/yyyy h:mma';

const signingSectionStyles = StyleSheet.create({
  underlinedText: {
    textDecoration: 'underline',
  },
  signatureView: {
    paddingRight: 32,
  },
  disclaimerText: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 8,
    fontStyle: 'italic',
  },
});

const labDetailsSectionStyles = StyleSheet.create({
  barcodeLabelText: {
    marginTop: 9,
  },
  divider: {
    borderBottom: '2px solid black',
    marginVertical: '10px',
  },
  detailsContainer: {
    marginBottom: 5,
  },
  heading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    fontWeight: 500,
    marginVertical: 3,
  },
});

const generalStyles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
});

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const LabRequestSigningSection = () => {
  const BaseSigningSection = ({ title }) => (
    <View style={{ flexDirection: 'column' }}>
      <P bold style={signingSectionStyles.underlinedText}>
        {title}
      </P>
      <View style={signingSectionStyles.signatureView}>
        <Signature text={'Signed'} />
        <Signature text={'Date'} />
      </View>
    </View>
  );

  return (
    <View>
      <Row>
        <Col>
          <BaseSigningSection title="Clinician" />
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

const LabRequestDetailsView = ({ labRequests }) => {
  const labTestTypeAccessor = ({ labTestPanelRequest, tests }) => {
    if (labTestPanelRequest) {
      return labTestPanelRequest.labTestPanel.name;
    }
    return tests?.map(test => test.labTestType?.name).join(', ') || '';
  };

  const notesAccessor = ({ notes }) => {
    return notes?.map(note => note.content).join(',\n');
  };

  return (
    <View>
      <Text style={labDetailsSectionStyles.heading}>Lab request details</Text>
      <HorizontalRule width="0.5px" />
      {labRequests.map(request => {
        return (
          <View key={request.id} style={labDetailsSectionStyles.detailsContainer}>
            <Row>
              <Col>
                <DataItem label="Request ID" value={request.displayId} />
                <DataItem label="Priority" value={request.priority?.name} />
                <DataItem
                  label="Requested date & time"
                  value={getDisplayDate(request.requestedDate, DATE_TIME_FORMAT)}
                />
                <DataItem label="Requested by" value={request.requestedBy?.displayName} />
                <DataItem label="Test category" value={request.category?.name} />
                <DataItem label="Tests" value={labTestTypeAccessor(request)} />
              </Col>
              <Col>
                <Row>
                  <P style={labDetailsSectionStyles.barcodeLabelText} bold>
                    Request ID barcode:
                  </P>
                  <PrintableBarcode id={request.displayId} />
                </Row>
              </Col>
            </Row>
            <Row>
              <DataItem label="Notes" value={notesAccessor(request)} />
            </Row>
            <HorizontalRule width="0.5px" />
            <Row>
              <Col>
                <DataItem
                  label="Sample date & time"
                  value={getDisplayDate(request.sampleTime, DATE_TIME_FORMAT)}
                />
                <DataItem label="Collected by" value={request.collectedBy?.displayName} />
              </Col>
              <Col>
                <DataItem label="Site" value={request.site?.name} />
                <DataItem label="Specimen type" value={request.specimenType?.name} />
              </Col>
            </Row>
            <View style={labDetailsSectionStyles.divider} />
          </View>
        );
      })}
    </View>
  );
};

export const MultipleLabRequestsPrintout = React.memo(
  ({
    patientData,
    labRequests,
    encounter,
    certificateData,
    getLocalisation,
  }) => {
    const { logo } = certificateData;

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <CertificateHeader>
            <LetterheadSection
              getLocalisation={getLocalisation}
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle="Lab Request"
            />
            <SectionContainer>
              <PatientDetailsWithBarcode patient={patientData} getLocalisation={getLocalisation} />
            </SectionContainer>
            <SectionContainer>
              <EncounterDetails encounter={encounter} />
            </SectionContainer>
          </CertificateHeader>
          <CertificateContent>
            <SectionContainer>
              <LabRequestDetailsView labRequests={labRequests} />
            </SectionContainer>
            <SectionContainer>
              <LabRequestSigningSection labRequests={labRequests} />
            </SectionContainer>
          </CertificateContent>
        </Page>
      </Document>
    );
  },
);

MultipleLabRequestsPrintout.propTypes = {
  patientData: PropTypes.object.isRequired,
  village: PropTypes.object.isRequired,
  encounter: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
