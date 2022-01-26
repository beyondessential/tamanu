import React from 'react';
import moment from 'moment';
import { Document, Page, Image } from '@react-pdf/renderer';
import { Table } from './Table';
import { styles, Col, Box, Row, Signature, SigningImage, Watermark, VDSImage } from './Layout';
import { H1, H2, H3, P } from './Typography';
import { Logo } from './Logo';
import {
  getCompletedDate,
  getLaboratory,
  getLabMethod,
  getRequestId,
  getDateOfSwab,
  getDOB,
} from './accessors';

const FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  {
    key: 'dateOfBirth',
    label: 'Date Of Birth',
    accessor: getDOB,
  },
  { key: 'sex', label: 'Sex' },
  { key: 'displayId', label: 'DisplayId' },
  { key: 'nationalityId', label: 'Nationality' },
  { key: 'passport', label: 'Passport' },
];

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

export const CovidCertificate = ({ patient, labs, signingImage, WatermarkImage, vds }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {WatermarkImage && <Watermark src={WatermarkImage} />}
        <Logo style={styles.logo} />
        <Box>
          <H1>TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES</H1>
          <H2>PO Box 12345, Melbourne, Australia</H2>
        </Box>
        <Box>
          <H3>Covid-19 Test History</H3>
          <Row>
            {FIELDS.map(({ key, label, accessor }) => {
              const value = (accessor ? accessor(patient) : patient[key]) || '';
              return (
                <Col key={key}>
                  <P>{`${label}: ${value}`}</P>
                </Col>
              );
            })}
          </Row>
        </Box>
        <Box mb={60}>
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
        <Row>
          <Col>
            {signingImage ? (
              <SigningImage data={signingImage.data} />
            ) : (
              <Box mb={0}>
                <Box>
                  <Signature text="Authorised by" />
                </Box>
                <Box mb={10}>
                  <Signature text="Signed" />
                </Box>
                <Box>
                  <Signature text="Date" />
                </Box>
              </Box>
            )}
          </Col>
          <Col>{vds && <VDSImage data={vds} />}</Col>
        </Row>
      </Page>
    </Document>
  );
};
