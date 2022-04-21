import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { Table } from './Table';
import { styles, Col, Box, Row, Watermark } from './Layout';
import { PatientDetailsSection } from './PatientDetailsSection';
import { SigningSection } from './SigningSection';
import { H3, P } from './Typography';
import { LetterheadSection } from './LetterheadSection';
import { getDisplayDate } from './getDisplayDate';

const columns = [
  {
    key: 'vaccine',
    title: 'Vaccine',
    customStyles: { minWidth: 30 },
    accessor: ({ scheduledVaccine }) => scheduledVaccine?.label,
  },
  {
    key: 'vaccineBrand',
    title: 'Vaccine brand',
    customStyles: { minWidth: 30 },
    accessor: ({ scheduledVaccine }) => scheduledVaccine?.vaccine?.name,
  },
  {
    key: 'schedule',
    title: 'Schedule',
    accessor: ({ scheduledVaccine }) => scheduledVaccine?.schedule,
  },
  {
    key: 'countryName',
    title: 'Country',
    accessor: ({ countryName }) => countryName,
  },
  {
    key: 'healthFacility',
    title: 'Health facility',
    customStyles: { minWidth: 30 },
    accessor: ({ healthFacility }) => healthFacility,
  },
  {
    key: 'date',
    title: 'Date',
    accessor: ({ date }, getLocalisation) => getDisplayDate(date, null, getLocalisation),
  },
  {
    key: 'batch',
    title: 'Batch Number',
    accessor: ({ batch }) => batch,
  },
];

export const VaccineCertificate = ({
  patient,
  printedBy,
  vaccinations,
  certificateId,
  signingSrc,
  watermarkSrc,
  vdsSrc,
  logoSrc,
  getLocalisation,
  extraPatientFields,
}) => {
  const contactEmail = getLocalisation('templates.vaccineCertificate.emailAddress');
  const contactNumber = getLocalisation('templates.vaccineCertificate.contactNumber');
  const healthFacility = getLocalisation('templates.vaccineCertificate.healthFacility');
  const countryName = getLocalisation('country.name');
  const data = vaccinations.map(vaccination => ({ ...vaccination, countryName, healthFacility }));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <LetterheadSection getLocalisation={getLocalisation} logoSrc={logoSrc} />
        <H3>Vaccination Certification</H3>
        <PatientDetailsSection
          patient={patient}
          vdsSrc={vdsSrc}
          getLocalisation={getLocalisation}
          certificateId={certificateId}
          extraFields={extraPatientFields}
        />
        <Box mb={20}>
          <Table data={data} columns={columns} getLocalisation={getLocalisation} />
        </Box>
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
        <Box>
          {contactEmail ? <P>Email address: {contactEmail}</P> : null}
          {contactNumber ? <P>Contact number: {contactNumber}</P> : null}
        </Box>
      </Page>
    </Document>
  );
};
