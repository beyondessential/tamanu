import React from 'react';
import PropTypes from 'prop-types';

import { getDateDisplay } from '../../DateDisplay';
import { useLocalisedText } from '../../LocalisedText';
import { Document, Page, View } from '@react-pdf/renderer';
import { styles } from '@tamanu/shared/utils/patientCertificates';
import { PatientDetailsWithBarcode } from '../../../../../shared/src/utils/patientCertificates/printComponents/PatientDetailsWithBarcode';
import { useLocalisation } from '../../../contexts/Localisation';
import {
  CertificateHeader,
  Col,
  Row,
  Signature,
} from '../../../../../shared/src/utils/patientCertificates/Layout';
import { LetterheadSection } from '../../../../../shared/src/utils/patientCertificates/LetterheadSection';
import { H3, P } from '../../../../../shared/src/utils/patientCertificates/Typography';
import { DataItem } from '../../../../../shared/src/utils/patientCertificates/printComponents/DataItem';
import { PrintableBarcode } from '../../../../../shared/src/utils/patientCertificates/printComponents/PrintableBarcode';
import { HorizontalRule } from '../../../../../shared/src/utils/patientCertificates/printComponents/HorizontalRule';
import { EncounterDetails } from '../../../../../shared/src/utils/patientCertificates/printComponents/EncounterDetails';
import { MultiPageHeader } from '../../../../../shared/src/utils/patientCertificates/printComponents/MultiPageHeader';
import { Footer } from '../../../../../shared/src/utils/patientCertificates/printComponents/Footer';
import { getName } from '../../../../../shared/src/utils/patientAccessors';
import { getDisplayDate } from '../../../../../shared/src/utils/patientCertificates/getDisplayDate';

export const MultipleLabRequestsPrintout = React.memo(
  ({ patient, labRequests, encounter, village, additionalData, certificateData }) => {
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' }).toLowerCase();
    const { title, subTitle, logo } = certificateData;
    const { getLocalisation } = useLocalisation();

    const labTestTypeAccessor = ({ labTestPanelRequest, tests }) => {
      if (labTestPanelRequest) {
        return labTestPanelRequest.labTestPanel.name;
      }
      return tests?.map(test => test.labTestType?.name).join(', ') || '';
    };

    const notesAccessor = ({ notes }) => {
      return notes?.map(note => note.content).join(', ');
    };

    const LabRequestDetailsView = ({ labRequests }) => {
      return (
        <View>
          <H3>Lab request details</H3>
          {labRequests.map(request => (
            <View key={request.id}>
              <HorizontalRule />
              <Row>
                <Col>
                  <DataItem label="Request ID" value={request.displayId} />
                  <DataItem label="Priority" value={request.priority?.name} />
                  <DataItem
                    label="Requested date & time"
                    value={getDateDisplay(request.requestedDate, { showTime: true })}
                  />
                  <DataItem label="Requested by" value={request.requestedBy?.displayName} />
                  <DataItem label="Test category" value={request.category?.name} />
                  <DataItem label="Tests" value={labTestTypeAccessor(request)} />
                </Col>
                <Col>
                  <Row>
                    <P style={{ marginTop: 9 }} bold>
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
                    value={getDateDisplay(request.sampleTime, { showTime: true })}
                  />
                  <DataItem label="Collected by" value={request.collectedBy?.displayName} />
                </Col>
                <Col>
                  <DataItem label="Site" value={request.site?.name} />
                  <DataItem label="Specimen type" value={request.specimenType?.name} />
                </Col>
              </Row>
              <HorizontalRule />
            </View>
          ))}
        </View>
      );
    };

    const BaseSigningSection = ({ title }) => (
      <Col>
        <P bold style={{ textDecoration: 'underline' }}>
          {title}
        </P>
        <View style={{ paddingRight: 32 }}>
          <Signature text={'Signed'} />
          <Signature text={'Date'} />
        </View>
      </Col>
    );

    const LabRequestSigningSection = () => (
      <View>
        <Row>
          <BaseSigningSection title="Clinician" />
          <BaseSigningSection title="Patient" />
        </Row>
      </View>
    );

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <MultiPageHeader documentName="Lab request" patientName={getName(patient)} patiendId={patient.displayId}/>
          <CertificateHeader>
            <LetterheadSection
              getLocalisation={getLocalisation}
              logoSrc={logo}
              certificateTitle="Lab Request"
            />
            <PatientDetailsWithBarcode patient={patient} getLocalisation={getLocalisation} />
          </CertificateHeader>
          <EncounterDetails encounter={encounter} />
          <LabRequestDetailsView labRequests={labRequests} />
          <LabRequestSigningSection />
          <Footer printDate={getDisplayDate(new Date())}/>
        </Page>
      </Document>
    );
  },
);

MultipleLabRequestsPrintout.propTypes = {
  patient: PropTypes.object.isRequired,
  village: PropTypes.object.isRequired,
  encounter: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
