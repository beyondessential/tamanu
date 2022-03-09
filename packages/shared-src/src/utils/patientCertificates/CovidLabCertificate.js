import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { Table } from './Table';
import { styles, Col, Box, Row, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsSection } from './PatientDetailsSection';
import { SigningSection } from './SigningSection';
import { H3, P } from './Typography';
import {
  getCompletedDate,
  getLaboratory,
  getLabMethod,
  getRequestId,
  getDateOfSwab,
} from './accessors';
import { getDisplayDate } from './getDisplayDate';

const columns = [
  {
    key: 'date-of-swab',
    title: 'Date of swab',
    accessor: getDateOfSwab,
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
    accessor: ({ tests }) => tests.result,
  },
];

export const CovidLabCertificate = ({
  patient,
  labs,
  signingSrc,
  watermarkSrc,
  vdsSrc,
  logoSrc,
  getLocalisation,
  printedBy,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <LetterheadSection getLocalisation={getLocalisation} logoSrc={logoSrc} />
        <Box mb={0}>
          <H3>Covid-19 Test History</H3>
          <PatientDetailsSection
            patient={patient}
            vdsSrc={vdsSrc}
            getLocalisation={getLocalisation}
          />
        </Box>
        <Box mb={30}>
          <Table data={labs} columns={columns} />
        </Box>
        <Box>
          <Row>
            <Col>
              <P>Printed by: {printedBy}</P>
            </Col>
            <Col>
              <P>Printing date: {getDisplayDate()}</P>
            </Col>
          </Row>
        </Box>
        <SigningSection signingSrc={signingSrc} />
      </Page>
    </Document>
  );
};
