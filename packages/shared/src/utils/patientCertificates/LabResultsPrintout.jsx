import React from 'react';

import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { PatientDetailsWithBarcode } from './printComponents/PatientDetailsWithBarcode';
import { styles, CertificateHeader } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { LabRequestDetailsView } from './LabRequestDetailsView';
import { Table } from './Table';
import { P } from './Typography';

const INTERIM_STATUSES = [
  LAB_REQUEST_STATUSES.RECEPTION_PENDING,
  LAB_REQUEST_STATUSES.RESULTS_PENDING,
  LAB_REQUEST_STATUSES.INTERIM_RESULTS,
  LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
];

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
});

const SectionContainer = props => <View style={generalStyles.container} {...props} />;

const makeReferenceRangeString = (labTestType, sex) => {
  if (!labTestType) return '';

  const max = sex === 'male' ? labTestType.maleMax : labTestType.femaleMax;
  const min = sex === 'male' ? labTestType.maleMin : labTestType.femaleMin;
  const hasMax = max || max === 0;
  const hasMin = min || min === 0;

  let baseRange;
  if (hasMin && hasMax) baseRange = `${min} – ${max}`;
  else if (hasMin) baseRange = `>${min}`;
  else if (hasMax) baseRange = `<${max}`;
  else if (labTestType.rangeText) baseRange = labTestType.rangeText;
  else baseRange = 'n/a';

  const unit = labTestType.unit;
  if (!unit) return baseRange;
  if (baseRange === 'n/a') return baseRange;
  return `${baseRange} ${unit}`;
};

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
    accessor: ({ labTestType }) => makeReferenceRangeString(labTestType, patientSex),
  },
];

const LabResultsPrintoutComponent = React.memo(
  ({ patientData, encounter, labRequest, certificateData, getLocalisation, getSetting }) => {
    const { logo } = certificateData;
    const showInterimBanner = INTERIM_STATUSES.includes(labRequest.status);
    const tests = labRequest.tests || [];
    const labResultsColumns = getLabResultsColumns(patientData?.sex);
    const labResultsHeaderStyleOverrides = { padding: 6 };

    return (
      <Document>
        <Page size="A4" style={styles.page}>
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
              labRequests={[labRequest]}
              showFullRequestDetails={false}
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
                  headerStyleOverrides={labResultsHeaderStyleOverrides}
                />
              </View>
            </SectionContainer>
          )}
        </Page>
      </Document>
    );
  },
);

export const LabResultsPrintout = withLanguageContext(LabResultsPrintoutComponent);
