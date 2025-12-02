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
    fontSize: 14,
    fontWeight: 700,
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
  detailsContainer: {
    marginBottom: 5,
  },
});

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const LabRequestDetailsSection = ({ labRequest }) => {
  const { getTranslation } = useLanguageContext();
  return (
    <View style={generalStyles.detailsContainer}>
      <P bold fontSize={11} mb={3}>
        {getTranslation('pdf.labResults.labRequestDetailsTitle', 'Lab request details')}
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

const InterimBanner = () => {
  const { getTranslation } = useLanguageContext();
  return (
    <View style={generalStyles.interimBannerText}>
      {getTranslation(
        'pdf.labResults.interimBanner',
        'This report contains interim results that have not yet been published',
      )}
    </View>
  );
};

const LabResultsPrintoutComponent = React.memo(
  ({ patientData, encounter, labRequest, certificateData, getLocalisation, getSetting }) => {
    const { getTranslation } = useLanguageContext();
    const { logo } = certificateData;
    const { tests, labTestPanelRequest } = labRequest;
    const labResultsColumns = [
      {
        key: 'labTestType.name',
        title: getTranslation('lab.results.table.column.testType', 'Test'),
        accessor: ({ labTestType }) => labTestType?.name || '',
      },
      {
        key: 'result',
        title: getTranslation('lab.results.table.column.result', 'Result'),
        accessor: ({ result, labTestType }) => {
          if (result === undefined || result === null || result === '') return '';
          const unit = labTestType?.unit;
          return unit ? `${result} ${unit}` : result;
        },
      },
      {
        key: 'reference',
        title: getTranslation('lab.results.table.column.reference', 'Reference'),
        accessor: ({ labTestType }) =>
          getReferenceRangeWithUnit({ labTestType, sex: patientData?.sex, getTranslation }),
      },
    ];

    /**
     * Currently it is only possible for one panel request per results printout
     * To support multiple panels, we can ensure that rows with the same panel name are ordered together
     * and then use the following to get the groups section label:
     * @example
     * getRowSectionLabel = (row) => row.panelName;
     */
    const getRowSectionLabel = () => labTestPanelRequest?.labTestPanel?.name;

    return (
      <Document>
        <Page size="A4" style={[styles.page, { paddingBottom: 50 }]}>
          {tests.length > 0 && (
            <MultiPageHeader
              documentName={getTranslation('pdf.labResults.documentName', 'Lab results')}
              documentSubname={getTranslation(
                'pdf.labResults.documentSubname',
                'Request ID: :requestId',
                { replacements: { requestId: labRequest?.displayId || '' } },
              )}
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
            {INTERIM_LAB_REQUEST_STATUSES.includes(labRequest.status) && <InterimBanner />}
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
                  hideRowDividers
                  data={tests}
                  columns={labResultsColumns}
                  getLocalisation={getLocalisation}
                  getSetting={getSetting}
                  getRowSectionLabel={getRowSectionLabel}
                  headerStyle={generalStyles.tableHeaderStyles}
                  columnStyle={generalStyles.tableColumnStyles}
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
