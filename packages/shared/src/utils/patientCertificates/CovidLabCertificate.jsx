import React from 'react';
import { Document } from '@react-pdf/renderer';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { Table } from './Table';
import { Box, Col, Row, styles, Watermark } from './Layout';
import { CovidLetterheadSection } from './CovidLetterheadSection';
import { CovidPatientDetailsSection } from './CovidPatientDetailsSection';
import { SigningSection } from './SigningSection';
import { H3, P } from './Typography';
import {
  getCompletedDate,
  getDateOfSwab,
  getLabMethod,
  getLaboratory,
  getRequestId,
  getTimeOfSwab,
} from './labRequestAccessors';
import { getDisplayDate } from './getDisplayDate';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';

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
    getSetting('templates.covidTestCertificate.clearanceCertRemark') ?? '',
    patient,
  ),
});

const CovidLabCertificateComponent = ({
  patient,
  labs,
  signingSrc,
  watermarkSrc,
  logoSrc,
  getLocalisation,
  getSetting,
  printedBy,
  certType,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {watermarkSrc && <Watermark src={watermarkSrc} />}
      <CovidLetterheadSection getSetting={getSetting} logoSrc={logoSrc} />
      <Box mb={0}>
        <H3>{CertificateTitle[certType] || ''}</H3>
        <CovidPatientDetailsSection
          patient={patient}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
        />
      </Box>
      <Box mb={30}>
        <Table
          data={labs}
          columns={columns}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
        />
      </Box>
      <P>{getCertificateRemark(patient, getSetting)[certType] || ''}</P>
      <Box />
      <Box>
        <Row>
          <Col>
            <P>Printed by: {printedBy}</P>
          </Col>
          <Col>
            <P>Printing date: {getDisplayDate(undefined, undefined, getLocalisation)}</P>
          </Col>
        </Row>
      </Box>
      <SigningSection signingSrc={signingSrc} />
    </Page>
  </Document>
);

export const CovidLabCertificate = withLanguageContext(CovidLabCertificateComponent);
