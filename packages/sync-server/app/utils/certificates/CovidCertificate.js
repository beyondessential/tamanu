import React from 'react';
import moment from 'moment';
import { Document, Page } from '@react-pdf/renderer';
import { Table } from './Table';
import { styles, Col, Box, Row, Signature } from './Layout';
import { H1, H2, H3, P } from './Typography';
import { Logo } from './Logo';

const FIELDS = ['firstName', 'lastName', 'dateOfBirth', 'placeOfBirth', 'countryOfBirthId', 'sex'];

const PRIMARY_DETAILS_FIELDS = {
  firstName: null,
  lastName: null,
  dateOfBirth: ({ dateOfBirth }) => moment(dateOfBirth).format('Do MMM YYYY'),
  placeOfBirth: ({ additionalData }) => additionalData?.placeOfBirth,
  countryOfBirthId: ({ additionalData }) => additionalData?.countryOfBirth?.name,
  sex: null,
  Mother: () => null, // TODO: not populated
  displayId: null,
};

export const CovidCertificate = ({ patient }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
              const value = (accessor ? accessor(patient) : patient[field]) || '';
              return (
                <Col key={field}>
                  <P>{`${field}: ${value}`}</P>
                </Col>
              );
            })}
          </Row>
        </Box>
        <Box mb={60}>
          <Table />
        </Box>
        <Box>
          <Row>
            <Col>
              <P>Printed by:</P>
            </Col>
            <Col>
              <P>Printing date:</P>
            </Col>
          </Row>
        </Box>
        <Box>
          <Signature text="Authorised by" />
        </Box>
        <Box mb={10}>
          <Signature text="Signed" />
        </Box>
        <Box>
          <Signature text="Date" />
        </Box>
      </Page>
    </Document>
  );
};
