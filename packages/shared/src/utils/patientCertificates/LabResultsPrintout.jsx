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
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import {
  MinimalLabRequestDetailsSection,
  SampleDetailsRow,
  PublishedDetailsRow,
} from './LabRequestDetailsSection';
import { Table } from './Table';
import { P } from './Typography';
import { getName } from '../patientAccessors';
import { HorizontalRule } from './printComponents/HorizontalRule';
import { DoubleHorizontalRule } from './printComponents/DoubleHorizontalRule';

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
  tableColumnStyles: {
    paddingLeft: 6,
    paddingVertical: 4,
    fontSize: 9,
  },
});

const labDetailsSectionStyles = StyleSheet.create({
  detailsContainer: {
    marginBottom: 5,
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

const InterimBanner = ({ getTranslation }) => (
  <View style={generalStyles.interimBannerText} fontSize={14} bold>
    {getTranslation(
      'pdf.labResults.interimBanner',
      'This report contains interim results that have not yet been published',
    )}
  </View>
);

const LabRequestDetailsSection = ({ labRequest }) => {
  return (
    <View style={labDetailsSectionStyles.detailsContainer}>
      <P bold fontSize={11} mb={3}>
        Lab request details
      </P>
      <HorizontalRule />
      <MinimalLabRequestDetailsSection request={labRequest} />
      <HorizontalRule />
      <SampleDetailsRow request={labRequest} />
      <HorizontalRule />
      <PublishedDetailsRow request={labRequest} />
      <DoubleHorizontalRule />
    </View>
  );
};

const LabResultsPrintoutComponent = React.memo(
  ({ patientData, encounter, labRequest, certificateData, getLocalisation, getSetting }) => {
    const { getTranslation } = useLanguageContext();
    const { logo } = certificateData;
    const showInterimBanner = INTERIM_LAB_REQUEST_STATUSES.includes(labRequest.status);
    const tests = labRequest.tests || [];
    const panelName = labRequest.labTestPanelRequest?.labTestPanel?.name;
    const labResultsColumns = getLabResultsColumns(patientData?.sex);

    /**
     * Currently it is only possible for one panel request per results printout
     * To support multiple panels, we can ensure that rows with the same panel name are ordered together
     * and then use the following to get the groups section label:
     * @example
     * getRowSectionLabel = (row) => row.panelName;
     */
    const getRowSectionLabel = () => panelName;

    return (
      <Document>
        <Page size="A4" style={[styles.page, { paddingBottom: 50 }]}>
          {tests.length > 0 && (
            <MultiPageHeader
              documentName={getTranslation('pdf.labResults.documentName', 'Lab results')}
              documentSubname={`Request ID: ${labRequest?.displayId || ''}`}
              patientId={patientData?.displayId || ''}
              patientName={getName(patientData)}
            />
          )}
          <CertificateHeader>
            <LetterheadSection
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle={getTranslation('pdf.labResults.documentName', 'Lab results')}
            />
            {showInterimBanner && (
              <InterimBanner getTranslation={getTranslation} />
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
            <LabRequestDetailsSection labRequest={labRequest} />
          </SectionContainer>
          {tests.length > 0 && (
            <SectionContainer>
              <P bold fontSize={11} mb={3}>
                {getTranslation('pdf.labResults.testResultsTitle', 'Test results')}
              </P>
              <View style={generalStyles.tableContainer}>
                <Table
                  data={tests}
                  columns={labResultsColumns}
                  getLocalisation={getLocalisation}
                  getSetting={getSetting}
                  headerStyle={generalStyles.tableHeaderStyles}
                  columnStyle={generalStyles.tableColumnStyles}
                  hideRowDividers
                  getRowSectionLabel={getRowSectionLabel}
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
