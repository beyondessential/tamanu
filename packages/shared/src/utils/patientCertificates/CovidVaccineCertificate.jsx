import React from 'react';
import { Document, Page } from '@react-pdf/renderer';

import { generateUVCI } from '../uvci';
import { Table } from './Table';
import { styles, Col, Box, Row, Watermark } from './Layout';
import { CovidPatientDetailsSection } from './CovidPatientDetailsSection';
import { SigningSection } from './SigningSection';
import { H3, P } from './Typography';
import { CovidLetterheadSection } from './CovidLetterheadSection';
import { getDisplayDate } from './getDisplayDate';
import { compareDateStrings } from '../dateTime';

const columns = [
  {
    key: 'vaccine',
    title: 'Vaccine',
    customStyles: { minWidth: 30 },
    accessor: ({ scheduledVaccine }) => (scheduledVaccine || {}).label,
  },
  {
    key: 'vaccineBrand',
    title: 'Vaccine brand',
    customStyles: { minWidth: 30 },
    accessor: ({ scheduledVaccine }) => ((scheduledVaccine || {}).vaccine || {}).name,
  },
  {
    key: 'schedule',
    title: 'Schedule',
    accessor: ({ scheduledVaccine }) => (scheduledVaccine || {}).schedule,
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
    accessor: ({ date }, getLocalisation) =>
      date ? getDisplayDate(date, undefined, getLocalisation) : 'Unknown',
  },
  {
    key: 'batch',
    title: 'Batch number',
    accessor: ({ batch }) => batch,
  },
];

export const CovidVaccineCertificate = ({
  patient,
  printedBy,
  vaccinations,
  certificateId,
  signingSrc,
  watermarkSrc,
  vdsSrc,
  logoSrc,
  uvci,
  getLocalisation,
  extraPatientFields,
  printedDate,
}) => {
  const contactEmail = getLocalisation('templates.vaccineCertificate.emailAddress');
  const contactNumber = getLocalisation('templates.vaccineCertificate.contactNumber');
  const healthFacility = getLocalisation('templates.vaccineCertificate.healthFacility');
  const countryCode = getLocalisation('country.alpha-2');
  const countryName = getLocalisation('country.name');
  const uvciFormat = getLocalisation('previewUvciFormat');

  const data = vaccinations.map(vaccination => ({ ...vaccination, countryName, healthFacility }));
  const vaxes = vaccinations.filter(v => v.certifiable).sort(compareDateStrings('desc'));
  const actualUvci = vaccinations.length
    ? uvci || generateUVCI((vaxes[0] || {}).id, { format: uvciFormat, countryCode })
    : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <CovidLetterheadSection getLocalisation={getLocalisation} logoSrc={logoSrc} />
        <H3>COVID-19 Vaccine Certificate</H3>
        <CovidPatientDetailsSection
          patient={patient}
          vdsSrc={vdsSrc}
          getLocalisation={getLocalisation}
          certificateId={certificateId}
          extraFields={extraPatientFields}
          uvci={actualUvci}
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
              <P>Printing date: {getDisplayDate(printedDate)}</P>
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
