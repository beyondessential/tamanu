import React from 'react';
import moment from 'moment';
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
  getLocalisation,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <LetterheadSection getLocalisation={getLocalisation} />
        <Box>
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
              <P>Printed by:</P>
            </Col>
            <Col>
              <P>Printing date: {moment().format('DD/MM/YYYY')}</P>
            </Col>
          </Row>
        </Box>
        <SigningSection signingSrc={signingSrc} />
      </Page>
    </Document>
  );
};
