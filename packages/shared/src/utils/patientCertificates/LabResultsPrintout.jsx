import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';

import { INTERIM_LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { getReferenceRangeWithUnit } from '@tamanu/utils/labTests';

import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { styles, CertificateHeader } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { Footer } from './printComponents/Footer';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { LabRequestDetailsView } from './LabRequestDetailsView';
import { Table } from './Table';
import { P } from './Typography';
import { getName } from '../patientAccessors';

const generalStyles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  interimBannerText: {
    border: '1px solid black',
    textAlign: 'center',
    padding: '8px',
    marginHorizontal: '18px',
  },
  tableContainer: {
    marginTop: 8,
  },
  tableHeaderStyles: {
    paddingLeft: 6,
    paddingVertical: 8,
    fontSize: 9,
  },
  tableBodyStyles: {
    paddingLeft: 6,
    paddingVertical: 4,
    fontSize: 9,
  },
});

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const getLabResultsColumns = patientSex => [
  {
    key: 'labTestType.name',
    title: 'Test',
    accessor: ({ labTestType }) => labTestType?.name || '',
  },
  {
    key: 'result',
    title: 'Result',
    accessor: ({ result, labTestType }) => {
      if (result === undefined || result === null || result === '') return '';
      const unit = labTestType?.unit;
      return unit ? `${result} ${unit}` : result;
    },
  },
  {
    key: 'reference',
    title: 'Reference',
    accessor: ({ labTestType }) => getReferenceRangeWithUnit(labTestType, patientSex),
  },
];

const LabResultsPrintoutComponent = React.memo(
  ({ patientData, encounter, labRequest, certificateData, getLocalisation, getSetting }) => {
    const { logo } = certificateData;
    const showInterimBanner = INTERIM_LAB_REQUEST_STATUSES.includes(labRequest.status);
    const tests = labRequest.tests || [];
    const labResultsColumns = getLabResultsColumns(patientData?.sex);
    return (
      <Document>
        <Page size="A4" style={[styles.page, { paddingBottom: 50 }]}>
          {tests.length > 0 && (
            <MultiPageHeader
              documentName="Lab request"
              documentSubname={`Request ID: ${labRequest?.displayId || ''}`}
              patientId={patientData?.displayId || ''}
              patientName={getName(patientData)}
            />
          )}
          <CertificateHeader>
            <LetterheadSection
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle="Lab results"
            />
            {showInterimBanner && (
              <P style={generalStyles.interimBannerText} fontSize={14} bold>
                This report contains interim results that have not yet been published
              </P>
            )}
            <SectionContainer>
              <PatientDetailsWithBarcode
                patient={patientData}
                getLocalisation={getLocalisation}
                getSetting={getSetting}
              />
            </SectionContainer>
            <SectionContainer>
              <EncounterDetails encounter={encounter} hideLocation />
            </SectionContainer>
          </CertificateHeader>
          <SectionContainer>
            <LabRequestDetailsView
              minimal
              labRequests={[labRequest]}
              showPublishedDetails
            />
          </SectionContainer>
          {tests.length > 0 && (
            <SectionContainer>
              <P bold fontSize={11} mb={3}>
                Test results
              </P>
              <View style={generalStyles.tableContainer}>
                <Table
                  data={tests}
                  columns={labResultsColumns}
                  getLocalisation={getLocalisation}
                  getSetting={getSetting}
                  hideRowDividers
                  headerStyleOverrides={generalStyles.tableHeaderStyles}
                  bodyStyleOverrides={generalStyles.tableBodyStyles}
                />
              </View>
            </SectionContainer>
          )}
          <Footer />
        </Page>
      </Document>
    );
  },
);

export const LabResultsPrintout = withLanguageContext(LabResultsPrintoutComponent);
