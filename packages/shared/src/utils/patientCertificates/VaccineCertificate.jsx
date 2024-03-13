import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';

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
import { CustomStyleSheet } from '../renderPdf';

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

const vaccineCertificateStyles = CustomStyleSheet.create({
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
  extraPatientFields,
  language
}) => {
  const healthFacility = getLocalisation('templates.vaccineCertificate.healthFacility');
  const countryName = getLocalisation('country.name');

  const data = vaccinations.map(vaccination => ({ ...vaccination, countryName, healthFacility }));

  const VaccineCertificateHeader = () => (
    <View style={vaccineCertificateStyles().documentHeaderContent}>
      <Text style={vaccineCertificateStyles(language).labelText}>Immunisation Certificate | </Text>
      <Text style={vaccineCertificateStyles(language).labelText}>Patient name: </Text>
      <Text style={vaccineCertificateStyles(language).valueText}>
        {patient.firstName} {patient.lastName} |{' '}
      </Text>
      <Text style={vaccineCertificateStyles(language).labelText}>Patient ID: </Text>
      <Text style={vaccineCertificateStyles(language).valueText}>{patient.displayId}</Text>
    </View>
  );

  const VaccineCertificateFooter = () => (
    <View style={vaccineCertificateStyles().footerContent}>
      <View style={vaccineCertificateStyles().footerLeft}>
        <Text style={vaccineCertificateStyles(language).labelText}>Print date: </Text>
        <Text style={vaccineCertificateStyles(language).valueText}>{getDisplayDate(printedDate)} | </Text>
        <Text style={vaccineCertificateStyles(language).labelText}>Printing facility: </Text>
        <Text style={vaccineCertificateStyles(language).valueText}>{facilityName || healthFacility} | </Text>
        <Text style={vaccineCertificateStyles(language).labelText}>Printed by: </Text>
        <Text style={vaccineCertificateStyles(language).valueText}>{printedBy}</Text>
      </View>
      <View style={vaccineCertificateStyles().footerRight}>
        <Text
          style={vaccineCertificateStyles(language).valueText}
          render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={{ ...styles().page, paddingBottom: 51 }}>
        <FixedHeader>
          <View fixed render={({ pageNumber }) => pageNumber > 1 && <VaccineCertificateHeader />} />
        </FixedHeader>
        <View fixed render={({ pageNumber }) => pageNumber > 1 && <PageBreakPadding />} />
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logoSrc}
            certificateTitle="Immunisation Certificate"
            language={language}
          />
          <PatientDetailsSection
            patient={patient}
            getLocalisation={getLocalisation}
            certificateId={certificateId}
            extraFields={extraPatientFields}
            language={language}
          />
        </CertificateHeader>
        <Box style={{ ...styles().box, marginLeft: '18px', marginRight: '18px' }}>
          <H3 style={{ marginBottom: 5, marginTop: 5 }} language={language}>Immunisation history</H3>
          <Table
            data={data}
            columns={columns}
            getLocalisation={getLocalisation}
            columnStyle={{ padding: '10px 5px' }}
            language={language}
          />
        </Box>
        <SigningSection signingSrc={signingSrc} language={language} />
        <FixedFooter>
          <VaccineCertificateFooter />
        </FixedFooter>
      </Page>
    </Document>
  );
};
