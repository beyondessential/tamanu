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

const pageStyles = StyleSheet.create({
  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
    paddingBottom: 50,
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
    borderBottom: '0.5px solid black',
    marginBottom: 8,
    alignSelf: 'flex-end'
  },
  itemText: {
    fontSize: 9,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },
  boldDivider: {
    borderBottom: '2px solid black',
    height: 2,
    width: '100%',
    marginTop: '-6px'
  },
  resultBox: {
    paddingTop: 7,
    paddingLeft: 11,
    paddingBottom: 6,
    marginBottom: 14,
    fontSize: 11,
    border: '0.5px solid black',
    gap: 5,
  },
});

const SectionSpacing = ({ height }) => <View style={{ paddingBottom: height ?? '10px' }} />;

const ResultBox = ({ resultText, resultName }) => (
  <View style={pageStyles.resultBox}>
    <Text>{resultName}</Text>
    <Text style={[pageStyles.itemText, pageStyles.boldText]}>{resultText}</Text>
  </View>
);

const ResponseItem = ({ row }) => {
  const { name, answer, type } = row;
  return (
    <View style={pageStyles.item} wrap={false}>
      <Text style={pageStyles.itemText}>{name}</Text>
      <Text style={[pageStyles.itemText, pageStyles.boldText]}>
        {type === PROGRAM_DATA_ELEMENT_TYPES.PHOTO
          ? 'Image file - Refer to Tamanu to view'
          : answer}
      </Text>
    </View>
  );
};

const ResponsesGroup = ({ rows }) => {
  return (
    <View style={pageStyles.groupContainer}>
      {rows.map(row => (
        <ResponseItem key={row.id} row={row} />
      ))}
      <View style={pageStyles.boldDivider}/>
    </View>
  );
};

const SurveyResponsesPrintoutComponent = ({
  patientData,
  certificateData,
  getLocalisation,
  surveyResponse,
  isReferral,
  facility,
  currentUser,
}) => {
  const { watermark, logo } = certificateData;

  const surveyAnswerRows = getSurveyAnswerRows(surveyResponse).filter(({ answer }) => answer);

  const groupedAnswerRows = Object.values(
    surveyAnswerRows.reduce((acc, item) => {
      if (!acc[item.screenIndex]) {
        acc[item.screenIndex] = [];
      }
      acc[item.screenIndex].push(item);
      return acc;
    }, {}),
  );

  const { strippedResultText } = separateColorText(surveyResponse.resultText);

  return (
    <Document>
      <Page size="A4" style={pageStyles.body}>
        {watermark && <Watermark src={watermark} />}
        <MultiPageHeader
          documentName={!isReferral ? "Program form" : "Referral"}
          documentSubname={surveyResponse.title}
          patientId={patientData.displayId}
          patientName={getName(patientData)}
        />
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logo}
            certificateTitle={!isReferral ? "Program form" : "Referral"}
            certificateSubtitle={surveyResponse.title}
            letterheadConfig={certificateData}
          />
        </CertificateHeader>
        <SectionSpacing />
        <PatientDetails getLocalisation={getLocalisation} patient={patientData} />

        <SurveyResponseDetails surveyResponse={surveyResponse} />
        <SectionSpacing height={16} />

        {strippedResultText && (
          <ResultBox
            resultText={strippedResultText}
            resultName={getResultName(surveyResponse.components)}
          />
        )}

        {groupedAnswerRows.map((group, index) => (
          <ResponsesGroup key={index} rows={group} />
        ))}

        <Footer printFacility={facility?.name} printedBy={currentUser?.displayName} />
      </Page>
    </Document>
  );
};

export const SurveyResponsesPrintout = withLanguageContext(SurveyResponsesPrintoutComponent);
