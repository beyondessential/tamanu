import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';

import { LAB_REQUEST_STATUS_LABELS } from '@tamanu/constants';
import {
  getReferenceRangeWithUnit,
  hasInterimLabResults,
  isInterimLabRequest,
} from '@tamanu/utils/labTests';

import { PatientDetails } from './printComponents/PatientDetails';
import { styles, CertificateHeader } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { Footer } from './printComponents/Footer';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { withDateTimeContext } from '../pdf/withDateTimeContext';
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
  page: {
    paddingBottom: 50,
  },
  container: {
    marginVertical: 6,
  },
  interimBannerText: {
    border: '1px solid black',
    textAlign: 'center',
    padding: '8px',
    marginHorizontal: '18px',
  },
  interimMarker: {
    border: '1px solid black',
    padding: '3px 6px',
    marginBottom: 6,
    alignSelf: 'flex-start',
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
  resultsInterpretationContainer: {
    border: '1px solid black',
    padding: 10,
    marginBottom: 10,
  },
  requestDivider: {
    borderBottom: '2px solid black',
    marginVertical: 10,
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
    <P style={generalStyles.interimBannerText} fontSize={14} bold>
      {getTranslation(
        'pdf.labResults.interimBanner',
        'This report contains interim results that have not yet been published',
      )}
    </P>
  );
};

// With several requests in one document the banner can't say which of them are unpublished, so
// each interim request is marked at the top of its own block.
const InterimMarker = ({ labRequest }) => {
  const { getEnumTranslation } = useLanguageContext();
  return (
    <P style={generalStyles.interimMarker} fontSize={9} bold>
      {getEnumTranslation(LAB_REQUEST_STATUS_LABELS, labRequest.status)}
    </P>
  );
};

const LabRequestBlock = ({
  labRequest,
  patientData,
  getSetting,
  showInterimMarker,
  showDivider,
}) => {
  const { getTranslation } = useLanguageContext();
  const { tests } = labRequest;

  const labResultsColumns = [
    {
      key: 'labTestType.name',
      title: getTranslation('lab.results.table.column.testType', 'Test'),
      accessor: ({ labTestType }) => labTestType?.name || '',
    },
    {
      key: 'result',
      title: getTranslation('lab.results.table.column.result', 'Result'),
      accessor: ({ result, secondaryResult, labTestType }) => {
        if (result === undefined || result === null || result === '') return '';
        const unit = labTestType?.unit;
        const resultWithUnit = unit ? `${result} ${unit}` : result;

        if (labTestType?.supportsSecondaryResults && secondaryResult) {
          return `${resultWithUnit} (${secondaryResult})`;
        }
        return resultWithUnit;
      },
    },
    {
      key: 'reference',
      title: getTranslation('lab.results.table.column.reference', 'Reference'),
      accessor: row =>
        getReferenceRangeWithUnit({
          labTestType: row.labTestType,
          labTest: row,
          sex: patientData?.sex,
          getTranslation,
        }),
    },
  ];

  // A request can hold several panels plus individual tests. Rows arrive grouped by panel and
  // ordered panels-first, so labelling each row by its own panel gives one section per panel,
  // matching the on-screen results table.
  const getRowSectionLabel = ({ labTestPanel }) =>
    labTestPanel?.name ?? getTranslation('lab.results.individualTests.label', 'Individual tests');

  return (
    <>
      {/* The divider and details are a fixed handful of rows, so keeping them whole can't
          overflow a page — and the divider travels with the block it introduces rather than
          being left stranded at the foot of the previous page. */}
      <SectionContainer wrap={false}>
        {showDivider && <View style={generalStyles.requestDivider} />}
        {showInterimMarker && isInterimLabRequest(labRequest) && (
          <InterimMarker labRequest={labRequest} />
        )}
        <LabRequestDetailsSection labRequest={labRequest} />
      </SectionContainer>
      {tests?.length > 0 && (
        <SectionContainer>
          <P bold fontSize={11} mb={3}>
            {getTranslation('pdf.labResults.testResultsTitle', 'Test results')}
          </P>
          <View style={generalStyles.tableContainer}>
            <Table
              hideRowDividers
              data={tests}
              columns={labResultsColumns}
              getSetting={getSetting}
              getRowSectionLabel={getRowSectionLabel}
              headerStyle={generalStyles.tableHeaderStyles}
              columnStyle={generalStyles.tableColumnStyles}
            />
          </View>
        </SectionContainer>
      )}
      {labRequest.resultsInterpretation && (
        <SectionContainer>
          <P bold fontSize={11} mb={3}>
            {getTranslation('pdf.labResults.resultsInterpretationTitle', 'Results interpretation')}
          </P>
          <View style={generalStyles.resultsInterpretationContainer}>
            <P fontSize={11}>{labRequest.resultsInterpretation}</P>
          </View>
        </SectionContainer>
      )}
    </>
  );
};

const LabResultsPrintoutComponent = React.memo(
  ({ patientData, encounter, labRequests, certificateData, getSetting }) => {
    const { getTranslation } = useLanguageContext();
    const { logo } = certificateData;
    const documentName = getTranslation('pdf.labResults.documentName', 'Lab results');
    // A single-request printout names its request in the running header; an encounter's printout
    // holds several, so it has no one request to name.
    const isSingleRequest = labRequests.length === 1;
    const hasAnyTests = labRequests.some(labRequest => labRequest.tests?.length > 0);

    return (
      <Document>
        <Page size="A4" style={[styles.page, generalStyles.page]}>
          {hasAnyTests && (
            <MultiPageHeader
              documentName={documentName}
              documentSubname={
                isSingleRequest
                  ? getTranslation('pdf.labResults.documentSubname', 'Request ID: :requestId', {
                      replacements: { requestId: labRequests[0]?.displayId || '' },
                    })
                  : undefined
              }
              patientId={patientData?.displayId || ''}
              patientName={getName(patientData)}
            />
          )}
          <CertificateHeader>
            <LetterheadSection
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle={documentName}
            />
            {hasInterimLabResults(labRequests) && <InterimBanner />}
            <SectionContainer>
              <PatientDetails patient={patientData} getSetting={getSetting} />
            </SectionContainer>
            <SectionContainer>
              <EncounterDetails hideLocation encounter={encounter} />
            </SectionContainer>
          </CertificateHeader>
          {labRequests.map((labRequest, index) => (
            <LabRequestBlock
              key={labRequest.id}
              labRequest={labRequest}
              patientData={patientData}
              getSetting={getSetting}
              showInterimMarker={!isSingleRequest}
              showDivider={index > 0}
            />
          ))}
          <Footer />
        </Page>
      </Document>
    );
  },
);

export const LabResultsPrintout = withLanguageContext(
  withDateTimeContext(LabResultsPrintoutComponent),
);
