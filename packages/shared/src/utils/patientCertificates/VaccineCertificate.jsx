import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

import { Table } from './Table';
import {
  styles,
  Box,
  Watermark,
  CertificateHeader,
  PageBreakPadding,
  FixedFooter,
  FixedHeader,
} from './Layout';
import { PatientDetailsSection } from './PatientDetailsSection';
import { H3 } from './Typography';
import { LetterheadSection } from './LetterheadSection';
import { getDisplayDate } from './getDisplayDate';
import { SigningSection } from './SigningSection';
import { defaultTranslationFn } from '../translation';

const columns = getTranslation => [
  {
    key: 'date',
    title: getTranslation('pdf.table.column.dateGiven', 'Date given'),
    accessor: ({ date }, getLocalisation) =>
      date ? getDisplayDate(date, undefined, getLocalisation) : 'Unknown',
  },
  {
    key: 'schedule',
    title: getTranslation('pdf.table.column.schedule', 'Schedule'),
    accessor: ({ scheduledVaccine }) => (scheduledVaccine || {}).schedule,
  },
  {
    key: 'vaccine',
    title: getTranslation('pdf.table.column.vaccine', 'Vaccine'),
    customStyles: { minWidth: 30 },
    accessor: ({ scheduledVaccine, vaccineName }) => vaccineName || (scheduledVaccine || {}).label,
  },
  {
    key: 'vaccineBrand',
    title: getTranslation('pdf.table.column.vaccineBrand', 'Vaccine brand'),
    customStyles: { minWidth: 30 },
    accessor: ({ scheduledVaccine, vaccineBrand }) =>
      vaccineBrand || ((scheduledVaccine || {}).vaccine || {}).name,
  },

  {
    key: 'countryName',
    title: getTranslation('pdf.table.column.country', 'Country'),
    accessor: ({ countryName }) => countryName,
  },
];

const vaccineCertificateStyles = StyleSheet.create({
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerRight: {
    flex: 1,
    textAlign: 'right',
  },
  labelText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 400,
    color: '#888888',
  },
  valueText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica',
    color: '#888888',
  },
  documentHeaderContent: {
    flexDirection: 'row',
  },
});

export const VaccineCertificate = ({
  patient,
  printedBy,
  printedDate,
  facilityName,
  vaccinations,
  certificateId,
  watermarkSrc,
  signingSrc,
  logoSrc,
  getLocalisation,
  getTranslation = defaultTranslationFn,
  extraPatientFields,
}) => {
  const healthFacility = getLocalisation('templates.vaccineCertificate.healthFacility');
  const countryName = getLocalisation('country.name');

  const data = vaccinations.map(vaccination => ({ ...vaccination, countryName, healthFacility }));

  const VaccineCertificateHeader = () => (
    <View style={vaccineCertificateStyles.documentHeaderContent}>
      <Text style={vaccineCertificateStyles.labelText}>
        {getTranslation(
          'pdf.vaccineCertificate.immunisationCertificate',
          'Immunisation Certificate',
        )}{' '}
        |{' '}
      </Text>
      <Text style={vaccineCertificateStyles.labelText}>
        {getTranslation('pdf.vaccineCertificate.patientName', 'Patient name')}:{' '}
      </Text>
      <Text style={vaccineCertificateStyles.valueText}>
        {patient.firstName} {patient.lastName} |{' '}
      </Text>
      <Text style={vaccineCertificateStyles.labelText}>
        {getTranslation('pdf.vaccineCertificate.patientId', 'Patient ID')}:{' '}
      </Text>
      <Text style={vaccineCertificateStyles.valueText}>{patient.displayId}</Text>
    </View>
  );

  const VaccineCertificateFooter = () => (
    <View style={vaccineCertificateStyles.footerContent}>
      <View style={vaccineCertificateStyles.footerLeft}>
        <Text style={vaccineCertificateStyles.labelText}>
          {getTranslation('pdf.vaccineCertificate.printDate', 'Print date')}:{' '}
        </Text>
        <Text style={vaccineCertificateStyles.valueText}>{getDisplayDate(printedDate)} | </Text>
        <Text style={vaccineCertificateStyles.labelText}>
          {getTranslation('pdf.vaccineCertificate.printingFacility', 'Printing facility')}:{' '}
        </Text>
        <Text style={vaccineCertificateStyles.valueText}>{facilityName || healthFacility} | </Text>
        <Text style={vaccineCertificateStyles.labelText}>
          {getTranslation('pdf.vaccineCertificate.printedBy', 'Printed by')}:{' '}
        </Text>
        <Text style={vaccineCertificateStyles.valueText}>{printedBy}</Text>
      </View>
      <View style={vaccineCertificateStyles.footerRight}>
        <Text
          style={vaccineCertificateStyles.valueText}
          render={({ pageNumber, totalPages }) =>
            getTranslation('pdf.vaccineCertificate.pagination', ':currentPage of :totalPages', {
              currentPage: pageNumber,
              totalPages,
            })
          }
        />
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, paddingBottom: 51 }}>
        <FixedHeader>
          <View fixed render={({ pageNumber }) => pageNumber > 1 && <VaccineCertificateHeader />} />
        </FixedHeader>
        <View fixed render={({ pageNumber }) => pageNumber > 1 && <PageBreakPadding />} />
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logoSrc}
            certificateTitle={getTranslation(
              'pdf.vaccineCertificate.title',
              'Immunisation Certificate',
            )}
          />
          <PatientDetailsSection
            patient={patient}
            getLocalisation={getLocalisation}
            certificateId={certificateId}
            extraFields={extraPatientFields}
            getTranslation={getTranslation}
          />
        </CertificateHeader>
        <Box style={{ ...styles.box, marginLeft: '18px', marginRight: '18px' }}>
          <H3 style={{ marginBottom: 5, marginTop: 5 }}>
            {getTranslation('pdf.vaccineCertificate.immunisationHistory', 'Immunisation history')}
          </H3>
          <Table
            data={data}
            columns={columns(getTranslation)}
            getLocalisation={getLocalisation}
            columnStyle={{ padding: '10px 5px' }}
          />
        </Box>
        <SigningSection signingSrc={signingSrc} getTranslation={getTranslation} />
        <FixedFooter>
          <VaccineCertificateFooter />
        </FixedFooter>
      </Page>
    </Document>
  );
};
