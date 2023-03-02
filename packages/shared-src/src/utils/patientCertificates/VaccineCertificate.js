import React from 'react';
import { Document, Page } from '@react-pdf/renderer';

import { Table } from './Table';
import { styles, Col, Box, Row, Watermark } from './Layout';
import { PatientDetailsSection } from './PatientDetailsSection';
import { SigningSection } from './SigningSection';
import { P } from './Typography';
import { LetterheadSection } from './LetterheadSection';
import { getDisplayDate } from './getDisplayDate';

const cellPadding = '10px 5px';

const columns = [
  {
    key: 'vaccine',
    title: 'Vaccine',
    customStyles: { minWidth: 30, padding: cellPadding },
    accessor: ({ scheduledVaccine }) => (scheduledVaccine || {}).label,
  },
  {
    key: 'vaccineBrand',
    title: 'Vaccine brand',
    customStyles: { minWidth: 30, padding: cellPadding },
    accessor: ({ scheduledVaccine }) => ((scheduledVaccine || {}).vaccine || {}).name,
  },
  {
    key: 'schedule',
    title: 'Schedule',
    customStyles: { padding: cellPadding },
    accessor: ({ scheduledVaccine }) => (scheduledVaccine || {}).schedule,
  },
  {
    key: 'countryName',
    title: 'Country',
    customStyles: { padding: cellPadding },
    accessor: ({ countryName }) => countryName,
  },
  {
    key: 'healthFacility',
    title: 'Health facility',
    customStyles: { minWidth: 30, padding: cellPadding },
    accessor: ({ healthFacility }) => healthFacility,
  },
  {
    key: 'date',
    title: 'Date',
    customStyles: { padding: cellPadding },
    accessor: ({ date }, getLocalisation) => getDisplayDate(date, undefined, getLocalisation),
  },
  {
    key: 'batch',
    title: 'Batch Number',
    customStyles: { minWidth: 30, padding: cellPadding },
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
        <LetterheadSection
          getLocalisation={getLocalisation}
          logoSrc={logoSrc}
          certificateTitle="Vaccination Certificate"
        />
        <PatientDetailsSection
          patient={patient}
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
              <P>
                <P bold>Printed by: </P>
                {printedBy}
              </P>
            </Col>
            <Col>
              <P>
                <P bold>Printing date: </P>
                {getDisplayDate(undefined, undefined, getLocalisation)}
              </P>
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
