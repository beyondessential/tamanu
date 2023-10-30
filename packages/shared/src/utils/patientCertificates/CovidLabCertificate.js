import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { replaceInTemplate } from '../replaceInTemplate';
import { Table } from './Table';
import { styles, Col, Box, Row, Watermark } from './Layout';
import { CovidLetterheadSection } from './CovidLetterheadSection';
import { CovidPatientDetailsSection } from './CovidPatientDetailsSection';
import { SigningSection } from './SigningSection';
import { H3, P } from './Typography';
import {
  getCompletedDate,
  getLaboratory,
  getLabMethod,
  getRequestId,
  getDateOfSwab,
  getTimeOfSwab,
} from './labRequestAccessors';
import { getDisplayDate } from './getDisplayDate';

const columns = [
  {
    key: 'date-of-swab',
    title: 'Date of swab',
    accessor: getDateOfSwab,
  },
  {
    key: 'time-of-swab',
    title: 'Time of swab',
    accessor: getTimeOfSwab,
  },
  {
    key: 'date-of-test',
    title: 'Date of test',
    accessor: getCompletedDate,
  },
  {
    key: 'laboratory',
    title: 'Laboratory',
    accessor: getLaboratory,
  },
  {
    key: 'requestId',
    title: 'Request ID',
    accessor: getRequestId,
  },
  {
    key: 'method',
    title: 'Method',
    accessor: getLabMethod,
  },
  {
    key: 'result',
    title: 'Result',
    accessor: ({ result }) => result,
  },
  {
    key: 'specimenType',
    title: 'Specimen type',
    accessor: ({ labTestType }) => (labTestType || {}).name || 'Unknown',
  },
];

export const CertificateTypes = {
  test: 'test',
  clearance: 'clearance',
};

const CertificateTitle = {
  test: 'Covid-19 Test History',
  clearance: 'Covid-19 Clearance Certificate',
};

const getCertificateRemark = (patient, getSetting) => ({
  test: '',
  clearance: replaceInTemplate(
    getSetting('localisation.templates.covidTestCertificate.clearanceCertRemark') ?? '',
    patient,
  ),
});

export const CovidLabCertificate = ({
  patient,
  labs,
  signingSrc,
  watermarkSrc,
  vdsSrc,
  logoSrc,
  printedBy,
  certType,
  getSetting,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {watermarkSrc && <Watermark src={watermarkSrc} />}
      <CovidLetterheadSection getSetting={getSetting} logoSrc={logoSrc} />
      <Box mb={0}>
        <H3>{CertificateTitle[certType] || ''}</H3>
        <CovidPatientDetailsSection patient={patient} vdsSrc={vdsSrc} getSetting={getSetting} />
      </Box>
      <Box mb={30}>
        <Table data={labs} columns={columns} getSetting={getSetting} />
      </Box>
      <P>{getCertificateRemark(patient, getSetting)[certType] || ''}</P>
      <Box />
      <Box>
        <Row>
          <Col>
            <P>Printed by: {printedBy}</P>
          </Col>
          <Col>
            <P>
              Printing date: {getDisplayDate(undefined, undefined, getSetting('countryTimeZone'))}
            </P>
          </Col>
        </Row>
      </Box>
      <SigningSection signingSrc={signingSrc} />
    </Page>
  </Document>
);
