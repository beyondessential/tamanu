import React from 'react';
import PropTypes from 'prop-types';

import { DateDisplay } from '../../DateDisplay';

import { PrintLetterhead } from './reusable/PrintLetterhead';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { ListTable } from './reusable/ListTable';
import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { NotesSection } from './reusable/NotesSection';
import { Divider } from './reusable/Divider';
import { DateFacilitySection } from './reusable/DateFacilitySection';
import { useLocalisedText } from '../../LocalisedText';
import { Document, Page, View } from '@react-pdf/renderer';
import { styles } from '@tamanu/shared/utils/patientCertificates';
import { PatientDetailsWithBarcode } from '../../../../../shared/src/utils/patientCertificates/printComponents/PatientDetailsWithBarcode';
import { useLocalisation } from '../../../contexts/Localisation';
import {
  CertificateHeader,
  Col,
  Row,
} from '../../../../../shared/src/utils/patientCertificates/Layout';
import { LetterheadSection } from '../../../../../shared/src/utils/patientCertificates/LetterheadSection';
import { DataSection } from '../../../../../shared/src/utils/patientCertificates/printComponents/DataSection';
import { P } from '../../../../../shared/src/utils/patientCertificates/Typography';
import { DataItem } from '../../../../../shared/src/utils/patientCertificates/printComponents/DataItem';
import { getDisplayDate } from '../../../../../shared/src/utils/patientCertificates/getDisplayDate';
import { PrintableBarcode } from '../../../../../shared/src/utils/patientCertificates/printComponents/PrintableBarcode';
import { HorizontalRule } from '../../../../../shared/src/utils/patientCertificates/printComponents/HorizontalRule';

export const MultipleLabRequestsPrintout = React.memo(
  ({ patient, labRequests, encounter, village, additionalData, certificateData }) => {
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' }).toLowerCase();
    const { title, subTitle, logo } = certificateData;
    const { getLocalisation } = useLocalisation();

    const idsAndNotes = labRequests.map(lr => [lr.displayId, lr.notes]);
    console.log(labRequests);
    console.log(idsAndNotes);
    const columns = [
      {
        key: 'displayId',
        title: 'Test ID',
        widthProportion: 2,
      },
      {
        key: 'date',
        title: 'Request date',
        accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
        widthProportion: 2,
      },
      {
        key: 'requestedBy',
        title: `Requesting ${clinicianText}`,
        accessor: ({ requestedBy }) => requestedBy?.displayName,
        widthProportion: 2,
      },
      {
        key: 'sampleTime',
        title: 'Sample time',
        accessor: ({ sampleTime }) => <DateDisplay date={sampleTime} showTime />,
        widthProportion: 2,
      },
      {
        key: 'priority',
        title: 'Priority',
        accessor: ({ priority }) => priority?.name || '',
        widthProportion: 2,
      },
      {
        key: 'category',
        title: 'Test category',
        accessor: ({ category }) => category?.name || '',
        widthProportion: 2,
      },
      {
        key: 'testType',
        title: 'Test type',
        accessor: ({ labTestPanelRequest, tests }) => {
          if (labTestPanelRequest) {
            return labTestPanelRequest.labTestPanel.name;
          }
          return tests?.map(test => test.labTestType?.name).join(', ') || '';
        },
        widthProportion: 3,
      },
    ];

    const labTestTypeAccessor = ({ labTestPanelRequest, tests }) => {
      if (labTestPanelRequest) {
        return labTestPanelRequest.labTestPanel.name;
      }
      return tests?.map(test => test.labTestType?.name).join(', ') || '';
    };

    console.log(labRequests);
    console.log(labRequests[0].notes.content);

    return (
      <Document>  
        <Page size="A4" style={styles.page}>
          <CertificateHeader>
            <LetterheadSection
              getLocalisation={getLocalisation}
              logoSrc={logo}
              certificateTitle="Lab Request"
            />
            <PatientDetailsWithBarcode patient={patient} getLocalisation={getLocalisation} />
          </CertificateHeader>
          {labRequests.map(request => (
            <View key={request.id}>
              <HorizontalRule />
              <Row>
                <Col>
                  <DataItem label="Request ID" value={request.displayId} />
                  <DataItem label="Priority" value={request.priority?.name} />
                  <DataItem
                    label="Requested date & time"
                    value={getDisplayDate(request.date, undefined, getLocalisation)}
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
                <DataItem label="Notes" value={request.notes.content} />
              </Row>
              <HorizontalRule />
              <Row>
                <Col>
                  <DataItem label="Sample date & time" value={getDisplayDate(request.sampleTime)} />
                  <DataItem label="Collected by" value={request.collectedBy?.displayName} />
                </Col>
                <Col>
                  <DataItem label="Site" value={request.site?.name} />
                  <DataItem label="Specimen type" value={request.specimenTypeId} />
                </Col>
              </Row>
              <HorizontalRule />
            </View>
          ))}
        </Page>
      </Document>
      // <CertificateWrapper>
      //   <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle="Lab Request" />
      //   <PatientDetailPrintout
      //     patient={patient}
      //     village={village}
      //     additionalData={additionalData}
      //   />
      //   <Divider />
      //   <DateFacilitySection encounter={encounter} />
      //   <ListTable data={labRequests} columns={columns} />
      //   <NotesSection idsAndNotes={idsAndNotes} />
      // </CertificateWrapper>
    );
  },
);

MultipleLabRequestsPrintout.propTypes = {
  patient: PropTypes.object.isRequired,
  additionalData: PropTypes.object.isRequired,
  village: PropTypes.object.isRequired,
  encounter: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
