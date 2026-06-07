import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

import { CertificateHeader, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { Footer } from './printComponents/Footer';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { PatientDetails } from './printComponents/PatientDetails';
import { getResultName, getSurveyAnswerRows, separateColorText } from './surveyAnswers';
import { SurveyResponseDetails } from './printComponents/SurveyResponseDetails';
import { getReferenceDataCategoryFromRowConfig } from '../translation/getReferenceDataCategoryFromRowConfig';
import { withDateTimeContext, useDateTime } from '../pdf/withDateTimeContext';
import { getReferenceDataOptionStringId, getReferenceDataStringId } from '../translation';

const pageStyles = StyleSheet.create({
  body: {
    fontFamily: 'Helvetica',
    paddingHorizontal: 50,
    paddingTop: 30,
    paddingBottom: 50,
    fontSize: 10,
  },
  groupContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  item: {
    width: 238,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingBottom: 4,
    borderBottom: '0.5pt solid black',
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  displayText: {
    marginBottom: 12,
    marginTop: 12,
    width: '100%',
  },
  boldDivider: {
    borderBottom: '2pt solid black',
    height: 2,
    width: '100%',
    marginTop: -6,
  },
  resultBox: {
    paddingTop: 7,
    paddingLeft: 11,
    paddingBottom: 6,
    marginBottom: 14,
    fontSize: 11,
    border: '0.5pt solid black',
    gap: 5,
  },
});

const SectionSpacing = ({ height }) => <View style={{ paddingBottom: height ?? '10px' }} />;

const ResultBox = ({ resultText, resultName }) => (
  <View style={pageStyles.resultBox}>
    <Text>{resultName}</Text>
    <Text>{resultText}</Text>
  </View>
);

const getAnswers = ({
  answer,
  type,
  getTranslation,
  dataElementId,
  config,
  originalBody,
  formatShort,
}) => {
  const translateOption = option => {
    return getTranslation(
      getReferenceDataOptionStringId(dataElementId, 'programDataElement', option),
      option,
    );
  };

  const translateReferenceData = a => {
    return getTranslation(
      getReferenceDataStringId(originalBody, getReferenceDataCategoryFromRowConfig(config)),
      a,
    );
  };

  switch (type) {
    case PROGRAM_DATA_ELEMENT_TYPES.RESULT: {
      const { strippedResultText } = separateColorText(answer);
      return strippedResultText;
    }
    case PROGRAM_DATA_ELEMENT_TYPES.CALCULATED:
      return parseFloat(answer).toFixed(1);
    case PROGRAM_DATA_ELEMENT_TYPES.PHOTO:
      return 'Image file - Refer to Tamanu to view';
    case PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE:
      return formatShort(answer);
    case PROGRAM_DATA_ELEMENT_TYPES.DATE:
      return formatShort(answer);
    case PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT:
      return JSON.parse(answer).map(translateOption).join(', ');
    case PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE:
      return translateReferenceData(answer);
    case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA:
      return answer;
    default:
      return translateOption(answer);
  }
};

const DisplayText = ({ row, getTranslation }) => {
  const { id: componentId, dataElementId, componentText, componentDetail, defaultText } = row;

  const label = componentText
    ? getTranslation(
        getReferenceDataStringId(componentId, 'surveyScreenComponent.text'),
        componentText,
      )
    : getTranslation(getReferenceDataStringId(dataElementId, 'programDataElement'), defaultText);
  const detail = componentDetail
    ? getTranslation(
        getReferenceDataStringId(componentId, 'surveyScreenComponent.detail'),
        componentDetail,
      )
    : null;

  return (
    <View style={pageStyles.displayText} wrap={false}>
      <Text>{label}</Text>
      {detail && <Text style={{ color: '#888', marginTop: 2 }}>{detail}</Text>}
    </View>
  );
};

const ResponseItem = ({ row, getTranslation, formatShort }) => {
  const { name, answer, type, dataElementId, config, originalBody } = row;
  return (
    <View style={pageStyles.item} wrap={false}>
      <Text>
        {getTranslation(getReferenceDataStringId(row.dataElementId, 'programDataElement'), name)}
      </Text>
      <Text bold>
        {getAnswers({
          answer,
          type,
          getTranslation,
          dataElementId,
          config,
          originalBody,
          formatShort,
        })}
      </Text>
    </View>
  );
};

const ResponsesGroup = ({ rows, getTranslation, formatShort }) => {
  return (
    <View style={pageStyles.groupContainer}>
      {rows.map(row =>
        row.type === PROGRAM_DATA_ELEMENT_TYPES.DISPLAY_TEXT ? (
          <DisplayText getTranslation={getTranslation} key={row.id} row={row} />
        ) : (
          <ResponseItem
            formatShort={formatShort}
            getTranslation={getTranslation}
            key={row.id}
            row={row}
          />
        ),
      )}
      <View style={pageStyles.boldDivider} />
    </View>
  );
};

const SurveyResponsesPrintoutComponent = ({
  patientData,
  certificateData,
  getTranslation,
  surveyResponse,
  isReferral,
  facility,
  currentUser,
  getSetting,
}) => {
  const { formatShort } = useDateTime();
  const { watermark, logo } = certificateData;

  const surveyAnswerRows = getSurveyAnswerRows(surveyResponse).filter(({ answer }) => answer);
  const groupedAnswerRows = Object.values(Object.groupBy(surveyAnswerRows, row => row.screenIndex));

  const { strippedResultText } = separateColorText(surveyResponse.resultText);

  const title = !isReferral
    ? getTranslation('pdf.surveyResponses.programForm', 'Program form')
    : getTranslation('pdf.surveyResponses.referral', 'Referral');

  return (
    <Document>
      <Page size="A4" style={pageStyles.body}>
        {watermark && <Watermark src={watermark} />}
        <MultiPageHeader
          documentName={title}
          documentSubname={surveyResponse.title}
          patientId={patientData.displayId}
          patientName={getName(patientData)}
        />
        <CertificateHeader>
          <LetterheadSection
            logoSrc={logo}
            certificateTitle={title}
            certificateSubtitle={surveyResponse.title}
            letterheadConfig={certificateData}
          />
        </CertificateHeader>
        <SectionSpacing />
        <PatientDetails patient={patientData} getSetting={getSetting} />

        <SurveyResponseDetails surveyResponse={surveyResponse} />
        <SectionSpacing height={16} />

        {strippedResultText && (
          <ResultBox
            resultText={strippedResultText}
            resultName={getResultName(surveyResponse.components)}
          />
        )}

        {groupedAnswerRows.map((group, index) => (
          <ResponsesGroup
            getTranslation={getTranslation}
            formatShort={formatShort}
            key={index}
            rows={group}
          />
        ))}

        <Footer printFacility={facility?.name} printedBy={currentUser?.displayName} />
      </Page>
    </Document>
  );
};

export const SurveyResponsesPrintout = withLanguageContext(
  withDateTimeContext(SurveyResponsesPrintoutComponent),
);
