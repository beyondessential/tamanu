import PropTypes from 'prop-types';
import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { getName } from '../patientAccessors';
import { BaseSigningSection } from './BaseSigningSection';
import { CertificateContent, CertificateHeader, Col, Row, styles } from './Layout';
import { NOTE_TYPES } from '@tamanu/constants/notes';
import { LetterheadSection } from './LetterheadSection';
import { DataItem } from './printComponents/DataItem';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { HorizontalRule } from './printComponents/HorizontalRule';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { startCase } from 'lodash';
import { DoubleHorizontalRule } from './printComponents/DoubleHorizontalRule';
import { withLanguageContext } from '../pdf/languageContext';
import { withDateTimeContext, useDateTime } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';

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
    fontSize: 11,
    marginVertical: 3,
  },
});

const generalStyles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
});

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const MultipleImagingRequestSigningSection = () => {
  return (
    <View>
      <Row>
        <BaseSigningSection />
      </Row>
    </View>
  );
};

const getImagingRequestType =
  imagingTypes =>
  ({ imagingType }) =>
    imagingTypes[imagingType]?.label || 'Unknown';

const getAreaNote = ({ areas, areaNote }) => {
  if (areas && areas.length > 0) {
    return areas.map(area => area.name).join(',');
  }
  if (areaNote) {
    // there's no sensible way to key this except by array index
    // eslint-disable-next-line react/no-array-index-key
    return areaNote;
  }
  return '';
};

const ImagingRequestDetailsView = ({ imagingRequests, getLocalisation }) => {
  const { formatShortDateTime } = useDateTime();
  const notesAccessor = ({ notes }) => {
    return notes
      ?.filter(note => note.noteTypeId === NOTE_TYPES.OTHER)
      .map(note => note.content)
      .join(', ');
  };

  const imagingTypes = getLocalisation('imagingTypes') || {};

  return (
    <View>
      <Text bold style={labDetailsSectionStyles.heading}>
        Imaging request details
      </Text>
      <HorizontalRule width="0.5px" />
      {imagingRequests.map((imagingRequest, index) => {
        return (
          <View key={imagingRequest.id} style={labDetailsSectionStyles.detailsContainer}>
            <Row>
              <Col>
                <DataItem label="Request ID" value={imagingRequest.displayId} />
                <DataItem label="Priority" value={startCase(imagingRequest.priority)} />
                <DataItem
                  label="Type"
                  value={getImagingRequestType(imagingTypes)(imagingRequest)}
                />
                <DataItem label="Area to be imaged" value={getAreaNote(imagingRequest)} />
                <DataItem label="Notes" value={notesAccessor(imagingRequest)} />
              </Col>
              <Col>
                <Row>
                  <DataItem
                    label="Requested date & time"
                    value={formatShortDateTime(imagingRequest.requestedDate)}
                  />
                  <DataItem label="Requested by" value={imagingRequest.requestedBy?.displayName} />
                </Row>
              </Col>
            </Row>
            <View style={{ marginTop: 5 }}>
              {index < imagingRequests.length - 1 ? (
                <HorizontalRule width="0.5px" />
              ) : (
                <DoubleHorizontalRule />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const MultipleImagingRequestsPrintoutComponent = React.memo(
  ({ patient, imagingRequests, encounter, certificateData, getLocalisation, getSetting }) => {
    const { logo } = certificateData;
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <MultiPageHeader
            documentName="Imaging request"
            patientName={getName(patient)}
            patientId={patient.displayId}
          />
          <CertificateHeader>
            <LetterheadSection
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle="Imaging Request"
            />
            <SectionContainer>
              <PatientDetailsWithBarcode patient={patient} getSetting={getSetting} />
            </SectionContainer>
            <SectionContainer>
              <EncounterDetails encounter={encounter} />
            </SectionContainer>
          </CertificateHeader>
          <CertificateContent>
            <SectionContainer>
              <ImagingRequestDetailsView
                imagingRequests={imagingRequests}
                getLocalisation={getLocalisation}
              />
            </SectionContainer>
            <SectionContainer>
              <MultipleImagingRequestSigningSection />
            </SectionContainer>
          </CertificateContent>
        </Page>
      </Document>
    );
  },
);

export const MultipleImagingRequestsPrintout = withLanguageContext(
  withDateTimeContext(MultipleImagingRequestsPrintoutComponent),
);

MultipleImagingRequestsPrintout.propTypes = {
  patient: PropTypes.object.isRequired,
  encounter: PropTypes.object.isRequired,
  imagingRequests: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
