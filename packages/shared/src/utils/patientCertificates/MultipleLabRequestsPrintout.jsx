import React from 'react';
import PropTypes from 'prop-types';

import { Document, Page, StyleSheet, View } from '@react-pdf/renderer';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { styles, CertificateContent, CertificateHeader, Col, Row, Signature } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { P } from './Typography';
import { DataItem } from './printComponents/DataItem';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { HorizontalRule } from './printComponents/HorizontalRule';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { Footer } from './printComponents/Footer';
import { getName } from '../patientAccessors';
import { getDisplayDate } from './getDisplayDate';
import { DoubleHorizontalRule } from './printComponents/DoubleHorizontalRule';

const DATE_TIME_FORMAT = 'dd/MM/yyyy h:mma';
const headingFontSize = 11;
const textFontSize = 9;

const signingSectionStyles = StyleSheet.create({
  underlinedText: {
    textDecoration: 'underline',
  },
  signatureView: {
    paddingRight: 32,
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
    fontSize: 11,
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
    <Col>
      <P bold style={signingSectionStyles.underlinedText} fontSize={9}>
        {title}
      </P>
      <View style={signingSectionStyles.signatureView}>
        <Signature text="Signed" fontSize={textFontSize} lineThickness={0.5} />
        <Signature text="Date" fontSize={textFontSize} lineThickness={0.5} />
      </View>
    </Col>
  );

  return (
    <View>
      <Row>
        <BaseSigningSection title="Clinician" />
        <BaseSigningSection title="Patient" />
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
    return notes?.map(note => note.content).join(', ');
  };

  return (
    <View>
      <P bold fontSize={headingFontSize} mb={3}>
        Lab request details
      </P>
      <HorizontalRule />
      {labRequests.map((request, index) => {
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
                  <P style={labDetailsSectionStyles.barcodeLabelText} fontSize={textFontSize} bold>
                    Request ID barcode:
                  </P>
                  <PrintableBarcode id={request.displayId} />
                </Row>
              </Col>
            </Row>
            <Row>
              <DataItem label="Notes" value={notesAccessor(request)} />
            </Row>
            <HorizontalRule />
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
            {index < labRequests.length - 1 && <View style={labDetailsSectionStyles.divider} />}
          </View>
        );
      })}
      <DoubleHorizontalRule />
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
          <MultiPageHeader
            documentName="Lab request"
            patientName={getName(patientData)}
            patiendId={patientData.displayId}
          />
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
          <Footer />
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
