import React from 'react';
import { Document, Page } from '@react-pdf/renderer';

import { Table } from './Table';
import {
  styles,
  Box,
  Watermark,
  CertificateHeader,
  CertificateFooter,
  DocumentFooter,
  DocumentHeader,
} from './Layout';
import { PatientDetailsSection } from './PatientDetailsSection';
import { H3 } from './Typography';
import { LetterheadSection } from './LetterheadSection';
import { getDisplayDate } from './getDisplayDate';

const columns = [
  {
    key: 'date',
    title: 'Date given',
    accessor: ({ date }, getLocalisation) =>
      date ? getDisplayDate(date, undefined, getLocalisation) : 'Unknown',
  },
  {
    key: 'schedule',
    title: 'Schedule',
    accessor: ({ scheduledVaccine }) => (scheduledVaccine || {}).schedule,
  },
  {
    key: 'vaccine',
    title: 'Vaccine',
    customStyles: { minWidth: 30 },
    accessor: ({ scheduledVaccine, vaccineName }) => vaccineName || (scheduledVaccine || {}).label,
  },
  {
    key: 'vaccineBrand',
    title: 'Vaccine brand',
    customStyles: { minWidth: 30 },
    accessor: ({ scheduledVaccine, vaccineBrand }) =>
      vaccineBrand || ((scheduledVaccine || {}).vaccine || {}).name,
  },

  {
    key: 'countryName',
    title: 'Country',
    accessor: ({ countryName }) => countryName,
  },
];

export const VaccineCertificate = ({
  patient,
  printedBy,
  printedDate,
  vaccinations,
  certificateId,
  watermarkSrc,
  logoSrc,
  getLocalisation,
  extraPatientFields,
}) => {
  const healthFacility = getLocalisation('templates.vaccineCertificate.healthFacility');
  const countryName = getLocalisation('country.name');

  const data = vaccinations.map(vaccination => ({ ...vaccination, countryName, healthFacility }));

  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, paddingBottom: 51 }}>
        <DocumentHeader
          patientName={`${patient.firstName} ${patient.lastName}`}
          patientId={patient.displayId}
        />
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logoSrc}
            certificateTitle="Immunisation Certificate"
          />
          <PatientDetailsSection
            patient={patient}
            getLocalisation={getLocalisation}
            certificateId={certificateId}
            extraFields={extraPatientFields}
          />
        </CertificateHeader>
        <Box style={{ ...styles.box, marginLeft: '18px', marginRight: '18px' }}>
          <H3>Immunisation history</H3>
          <Table
            data={data}
            columns={columns}
            getLocalisation={getLocalisation}
            columnStyle={{ padding: '10px 5px' }}
          />
        </Box>
        <CertificateFooter />
        <DocumentFooter
          printedBy={printedBy}
          printDate={printedDate}
          printFacility={healthFacility}
        />
      </Page>
    </Document>
  );
};
