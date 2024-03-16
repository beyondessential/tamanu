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
import { useLanguageContext, withLanguageContext } from '../languageContext';

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
    color: '#888888',
  },
  documentHeaderContent: {
    flexDirection: 'row',
  },
});

const VaccineCertificateComponent = ({
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
}) => {
  const { language } = useLanguageContext();
  const healthFacility = getLocalisation('templates.vaccineCertificate.healthFacility');
  const countryName = getLocalisation('country.name');

  const data = vaccinations.map(vaccination => ({ ...vaccination, countryName, healthFacility }));

  const VaccineCertificateHeader = () => (
    <View style={vaccineCertificateStyles().documentHeaderContent}>
      <Text style={vaccineCertificateStyles(language).labelText}>Immunisation Certificate | </Text>
      <Text style={vaccineCertificateStyles(language).labelText}>Patient name: </Text>
      <Text style={vaccineCertificateStyles().valueText}>
        {patient.firstName} {patient.lastName} |{' '}
      </Text>
      <Text style={vaccineCertificateStyles(language).labelText}>Patient ID: </Text>
      <Text style={vaccineCertificateStyles().valueText}>{patient.displayId}</Text>
    </View>
  );

  const VaccineCertificateFooter = () => (
    <View style={vaccineCertificateStyles().footerContent}>
      <View style={vaccineCertificateStyles().footerLeft}>
        <Text style={vaccineCertificateStyles(language).labelText}>Print date: </Text>
        <Text style={vaccineCertificateStyles().valueText}>{getDisplayDate(printedDate)} | </Text>
        <Text style={vaccineCertificateStyles(language).labelText}>Printing facility: </Text>
        <Text style={vaccineCertificateStyles().valueText}>{facilityName || healthFacility} | </Text>
        <Text style={vaccineCertificateStyles(language).labelText}>Printed by: </Text>
        <Text style={vaccineCertificateStyles().valueText}>{printedBy}</Text>
      </View>
      <View style={vaccineCertificateStyles().footerRight}>
        <Text
          style={vaccineCertificateStyles().valueText}
          render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={{ ...styles(language).page, paddingBottom: 51 }}>
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
          />
          <PatientDetailsSection
            patient={patient}
            getLocalisation={getLocalisation}
            certificateId={certificateId}
            extraFields={extraPatientFields}
          />
        </CertificateHeader>
        <Box style={{ ...styles().box, marginLeft: '18px', marginRight: '18px' }}>
          <H3 style={{ marginBottom: 5, marginTop: 5 }}>Immunisation history</H3>
          <Table
            data={data}
            columns={columns}
            getLocalisation={getLocalisation}
            columnStyle={{ padding: '10px 5px' }}
          />
        </Box>
        <SigningSection signingSrc={signingSrc} />
        <FixedFooter>
          <VaccineCertificateFooter />
        </FixedFooter>
      </Page>
    </Document>
  );
};

export const VaccineCertificate = withLanguageContext(VaccineCertificateComponent)
