import React from 'react';
import moment from 'moment';
import { Document, Page } from '@react-pdf/renderer';
import { Table } from './Table';
import { styles, Col, Box, Row, Watermark } from './Layout';
import { PatientDetailsSection } from './PatientDetailsSection';
import { SigningSection } from './SigningSection';
import { H3, P } from './Typography';
import { getDisplayDate } from './accessors';
import { LetterheadSection } from './LetterheadSection';

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
    accessor: ({ date }) => getDisplayDate(date),
  },
];

export const VaccineCertificate = ({
  patient,
  vaccines,
  signingSrc,
  watermarkSrc,
  vdsSrc,
  getLocalisation,
}) => {
  const hasEditedRecord =
    vaccines.findIndex(vaccine => vaccine.createdAt !== vaccine.updatedAt) !== -1;

  const contactEmail = getLocalisation('templates.vaccineCertificateFooter.emailAddress');
  const contactNumber = getLocalisation('templates.vaccineCertificateFooter.contactNumber');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <LetterheadSection getLocalisation={getLocalisation} />
        <H3>Personal vaccination certificate</H3>
        <PatientDetailsSection
          patient={patient}
          vdsSrc={vdsSrc}
          getLocalisation={getLocalisation}
        />
        <Box mb={20} mt={10}>
          <Table data={vaccines} columns={columns} />
          {hasEditedRecord && (
            <P mt={10}>
              * This vaccine record has been updated by a user and this is the most recent record
            </P>
          )}
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
        <Box>
          <P>Email address: {contactEmail}</P>
          <P>Contact number: {contactNumber}</P>
        </Box>
      </Page>
    </Document>
  );
};
