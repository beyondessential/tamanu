import React from 'react';
import config from 'config';
import moment from 'moment';
import { Document, Page } from '@react-pdf/renderer';
import { Table } from './Table';
import { styles, Col, Box, Row, Signature, SigningImage, Watermark } from './Layout';
import { H1, H2, H3, P } from './Typography';
import { Logo } from './Logo';
import {
  getCompletedDate,
  getLaboratory,
  getLabMethod,
  getRequestId,
  getLabOfficer,
  getDateOfSwab,
} from './accessors';

const FIELDS = ['firstName', 'lastName', 'dateOfBirth', 'placeOfBirth', 'countryOfBirthId', 'sex'];

const PRIMARY_DETAILS_FIELDS = {
  firstName: null,
  lastName: null,
  dateOfBirth: ({ dateOfBirth }) => moment(dateOfBirth).format('Do MMM YYYY'),
  placeOfBirth: ({ additionalData }) => additionalData?.placeOfBirth,
  countryOfBirthId: ({ additionalData }) => additionalData?.countryOfBirth?.name,
  sex: null,
  displayId: null,
};

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
    key: 'laboratoryOfficer',
    title: 'Lab officer',
    accessor: getLabOfficer,
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

const getShortLabel = field => {
  const { fields } = config.localisation.data;
  return fields[field]?.shortLabel || field;
};

export const CovidCertificate = ({ data, signingImage, watermark }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {watermark && <Watermark data={watermark.data} />}
      <Logo style={styles.logo} />
      <Box>
        <H1>TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES</H1>
        <H2>PO Box 12345, Melbourne, Australia</H2>
      </Box>
      <Box>
        <H3>Covid-19 Test History</H3>
        <Row>
          {FIELDS.map(field => {
            const accessor = PRIMARY_DETAILS_FIELDS[field];
            const label = getShortLabel(field);
            const value = (accessor ? accessor(data) : data[field]) || '';
            return (
              <Col key={field}>
                <P>{`${label}: ${value}`}</P>
              </Col>
            );
          })}
        </Row>
      </Box>
      <Box mb={60}>
        <Table data={data.labs} columns={columns} />
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
      {signingImage ? (
        <SigningImage data={signingImage.data} />
      ) : (
        <>
          <Box>
            <Signature text="Authorised by" />
          </Box>
          <Box mb={10}>
            <Signature text="Signed" />
          </Box>
          <Box>
            <Signature text="Date" />
          </Box>
        </>
      )}
    </Page>
  </Document>
);
