import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { get } from 'lodash';

import {
  Box,
  CertificateHeader,
  FixedFooter,
  FixedHeader,
  PageBreakPadding,
  Watermark,
  styles,
} from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsSection } from './PatientDetailsSection';
import { SigningSection } from './SigningSection';
import { Table } from './Table';
import { H3 } from './Typography';
import { useTextStyles } from './printComponents/MultiPageHeader';
import { Page } from '../pdf/Page';
import { Text, TextWithoutContext } from '../pdf/Text';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { useDateTime, withDateTimeContext } from '../pdf/withDateTimeContext';

const getColumns = (getTranslation, formatShort) => [
  {
    key: 'date',
    title: getTranslation('pdf.table.column.dateGiven', 'Date given'),
    accessor: ({ date }) => date ? formatShort(date) : 'Unknown',
  },
  {
    key: 'schedule',
    title: getTranslation('pdf.table.column.schedule', 'Schedule'),
    accessor: ({ scheduledVaccine }) => (scheduledVaccine || {}).doseLabel,
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
    title: getTranslation('pdf.table.column.country', 'Facility/Country'),
    accessor: record => {
      const facility = record.givenElsewhere ? record.givenBy : record.location?.facility?.name;
      return facility || '';
    },
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
    color: '#888888',
  },
  valueText: {
    fontSize: 8,
    color: '#888888',
  },
  documentHeaderContent: {
    flexDirection: 'row',
  },
});

const VaccineCertificateHeader = ({ patient }) => {
  const valueStyles = useTextStyles(vaccineCertificateStyles.valueText);
  const labelStyles = useTextStyles(vaccineCertificateStyles.labelText);

  const { getTranslation, makeIntlStyleSheet, pdfFontBold, pdfFont } = useLanguageContext();
  const textContextProps = { makeIntlStyleSheet, pdfFontBold, pdfFont };

  const ValueText = props => (
    <TextWithoutContext style={valueStyles} {...textContextProps} {...props} />
  );
  const LabelText = props => (
    <TextWithoutContext bold style={labelStyles} {...textContextProps} {...props} />
  );

  return (
    <View
      fixed
      render={({ pageNumber }) =>
        pageNumber > 1 && (
          <View style={vaccineCertificateStyles.documentHeaderContent}>
            <ValueText>
              {getTranslation(
                'pdf.vaccineCertificate.immunisationCertificate',
                'Immunisation Certificate',
              )}{' '}
              |{' '}
            </ValueText>
            <LabelText>
              {getTranslation('pdf.vaccineCertificate.patientName', 'Patient name')}:{' '}
            </LabelText>
            <ValueText>
              {patient.firstName} {patient.lastName} |{' '}
            </ValueText>
            <LabelText>
              {getTranslation('pdf.vaccineCertificate.patientId', 'Patient ID')}:{' '}
            </LabelText>
            <ValueText>{patient.displayId}</ValueText>
          </View>
        )
      }
    />
  );
};

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
  localisation,
  getSetting,
  extraPatientFields,
  certificateData,
  healthFacility,
}) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTime();
  const getLocalisation = key => get(localisation, key);
  const countryName = getLocalisation('country.name');

  const data = vaccinations.map(vaccination => ({ ...vaccination, countryName, healthFacility }));
  const columns = getColumns(getTranslation, formatShort);

  const VaccineCertificateFooter = () => (
    <View style={vaccineCertificateStyles.footerContent}>
      <View style={vaccineCertificateStyles.footerLeft}>
        <Text bold style={vaccineCertificateStyles.labelText}>
          {getTranslation('pdf.vaccineCertificate.printDate', 'Print date')}:{' '}
        </Text>
        <Text bold style={vaccineCertificateStyles.valueText}>
          {formatShort(printedDate)} |{' '}
        </Text>
        <Text bold style={vaccineCertificateStyles.labelText}>
          {getTranslation('pdf.vaccineCertificate.printingFacility', 'Printing facility')}:{' '}
        </Text>
        <Text bold style={vaccineCertificateStyles.valueText}>
          {facilityName || healthFacility} |{' '}
        </Text>
        <Text bold style={vaccineCertificateStyles.labelText}>
          {getTranslation('pdf.vaccineCertificate.printedBy', 'Printed by')}:{' '}
        </Text>
        <Text bold style={vaccineCertificateStyles.valueText}>
          {printedBy}
        </Text>
      </View>
      <View style={vaccineCertificateStyles.footerRight}>
        <Text
          bold
          style={vaccineCertificateStyles.valueText}
          render={({ pageNumber, totalPages }) =>
            getTranslation('pdf.pagination', ':currentPage of :totalPages', {
              replacements: {
                currentPage: pageNumber,
                totalPages,
              },
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
          <VaccineCertificateHeader patient={patient} />
        </FixedHeader>
        <View fixed render={({ pageNumber }) => pageNumber > 1 && <PageBreakPadding />} />
        {watermarkSrc && <Watermark src={watermarkSrc} />}
        <CertificateHeader>
          <LetterheadSection
            logoSrc={logoSrc}
            certificateTitle={getTranslation(
              'pdf.vaccineCertificate.title',
              'Immunisation Certificate',
            )}
            letterheadConfig={certificateData}
          />
          <PatientDetailsSection
            patient={patient}
            getSetting={getSetting}
            certificateId={certificateId}
            extraFields={extraPatientFields}
          />
        </CertificateHeader>
        <Box
          style={{ ...styles.box, marginLeft: '18px', marginRight: '18px', marginBottom: '0px' }}
        >
          <H3 style={{ marginBottom: 5, marginTop: 5 }}>
            {getTranslation('pdf.vaccineCertificate.immunisationHistory', 'Immunisation history')}
          </H3>
          <Table
            data={data}
            columns={columns}
            getSetting={getSetting}
            columnStyle={{ padding: '10px 5px' }}
          />
        </Box>
        <SigningSection
          signingSrc={signingSrc}
          getTranslation={getTranslation}
          style={{ marginTop: 30 }}
          wrap={false}
        />
        <FixedFooter>
          <VaccineCertificateFooter />
        </FixedFooter>
      </Page>
    </Document>
  );
};

export const VaccineCertificate = withLanguageContext(
  withDateTimeContext(VaccineCertificateComponent),
);
