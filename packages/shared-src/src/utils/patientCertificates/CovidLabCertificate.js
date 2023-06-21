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
} from './accessors';
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

const getCertificateRemark = (patient, getLocalisation) => ({
  test: '',
  clearance: replaceInTemplate(
    getLocalisation('templates.covidTestCertificate.clearanceCertRemark') ?? '',
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
  getLocalisation,
  printedBy,
  certType,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {watermarkSrc && <Watermark src={watermarkSrc} />}
      <CovidLetterheadSection getLocalisation={getLocalisation} logoSrc={logoSrc} />
      <Box mb={0}>
        <H3>{CertificateTitle[certType] || ''}</H3>
        <CovidPatientDetailsSection
          patient={patient}
          vdsSrc={vdsSrc}
          getLocalisation={getLocalisation}
        />
      </Box>
      <Box mb={30}>
        <Table data={labs} columns={columns} getLocalisation={getLocalisation} />
      </Box>
      <P>{getCertificateRemark(patient, getLocalisation)[certType] || ''}</P>
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
