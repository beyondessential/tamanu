import React from 'react';
import moment from 'moment';
import { Document, Page } from '@react-pdf/renderer';
import { Table } from './Table';
import { styles, Col, Box, Row, Signature, SigningImage, Watermark, VDSImage } from './Layout';
import { H1, H2, H3, P } from './Typography';
import { Logo } from './Logo';
import { getDOB } from './accessors';

const FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  {
    key: 'dateOfBirth',
    label: 'Date Of Birth',
    accessor: getDOB,
  },
  {
    key: 'placeOfBirth',
    label: 'Place Of Birth',
    accessor: getDOB,
  },
  {
    key: 'countryOfBirth',
    label: 'Country Of Birth',
    accessor: getDOB,
  },
  { key: 'sex', label: 'Sex' },
  { key: 'displayId', label: 'NHN' },
];

const columns = [
  {
    key: 'vaccineType',
    title: 'Vaccine type',
    accessor: ({ scheduledVaccine, createdAt, updatedAt }) => {
      const label = scheduledVaccine?.label;
      const star = createdAt !== updatedAt ? ' *' : '';
      return `${label}${star}`;
    },
  },
  {
    key: 'vaccineGiven',
    title: 'Vaccine given',
    accessor: ({ scheduledVaccine }) => scheduledVaccine?.label,
  },
  {
    key: 'schedule',
    title: 'Schedule',
    accessor: ({ scheduledVaccine }) => scheduledVaccine?.schedule,
  },
  {
    key: 'healthFacility',
    title: 'Health facility',
    accessor: ({ encounter }) => encounter?.location?.name || '',
  },
  {
    key: 'givenBy',
    title: 'Given by',
    accessor: ({ encounter }) => encounter?.examiner?.displayName || '',
  },
  {
    key: 'date',
    title: 'Date',
    accessor: ({ date }) => date,
  },
];

export const VaccineCertificate = ({
  patient,
  immunisations,
  signingSrc,
  watermarkSrc,
  vdsSrc,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <Logo style={styles.logo} />
        <Box>
          <H1>TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES</H1>
          {/* Todo: get the address from config */}
          <H2>PO Box 12345, Melbourne, Australia</H2>
        </Box>
        <Box>
          <H3>Covid-19 Test History</H3>
          <Row>
            <Col style={{ width: '80%' }}>
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
            </Col>
            <Col style={{ width: '20%' }}>{vdsSrc && <VDSImage src={vdsSrc} />}</Col>
          </Row>
        </Box>
        <Box mb={60}>
          <Table data={immunisations} columns={columns} />
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
          {signingSrc ? (
            <SigningImage src={signingSrc} />
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
        </Row>
      </Page>
    </Document>
  );
};
