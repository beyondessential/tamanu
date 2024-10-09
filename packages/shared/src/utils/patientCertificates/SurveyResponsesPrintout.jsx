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

const INITAL_ITEMS_PER_COLUMN = 10;
const INITAL_ITEMS_PER_COLUMN_WITH_RESULT = 9;
const ITEMS_PER_COLUMN = 15;

const pageStyles = StyleSheet.create({
  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
    paddingBottom: 50,
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    position: 'relative',
  },
  column: {
    width: '50%',
    flexDirection: 'column',
  },
  firstColumn: {
    paddingRight: 10,
  },
  secondColumn: {
    paddingLeft: 10,
  },
  item: {
    paddingTop: 8,
    minHeight: 50,
    maxHeight: 50,
    position: 'relative',
  },
  itemText: {
    fontSize: 9,
    marginBottom: 2,
  },
  answerContainer: {
    borderBottom: '0.5px solid black',
    paddingBottom: 2,
    position: 'relative',
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },
  verticalDivider: {
    position: 'absolute',
    left: '50%',
    width: 1,
    backgroundColor: 'black',
    height: '100%',
  },
  boldDivider: {
    borderBottom: '2px solid black',
    height: 2,
    width: '100%',
    position: 'absolute',
    bottom: '-5px',
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

const ResponseColumn = ({ row, showBoldBorder }) => {
  const { name, answer, type } = row;
  return (
    <View style={pageStyles.item}>
      <Text style={pageStyles.itemText}>{name}</Text>
      <View style={pageStyles.answerContainer}>
        <Text style={[pageStyles.itemText, pageStyles.boldText]}>
          {type === PROGRAM_DATA_ELEMENT_TYPES.PHOTO
            ? 'Image file - Refer to Tamanu to view'
            : answer}
        </Text>
        {showBoldBorder && <View style={pageStyles.boldDivider} />}
      </View>
    </View>
  );
};

const ColumnsContainer = ({ answerRows, itemsPerColumn, hasResult }) => {
  let columnHeight = '87vh';

  if (itemsPerColumn !== ITEMS_PER_COLUMN) {
    if (hasResult) {
      columnHeight = '54vh';
    } else {
      columnHeight = '61vh';
    }
  }

  const firstAnswerRows = answerRows.slice(0, itemsPerColumn + 1);
  const secondAnswerRows = answerRows.slice(itemsPerColumn);

  return (
    <View style={pageStyles.container} wrap={false}>
      {[firstAnswerRows, secondAnswerRows].map((rows, index) => (
        <View
          style={[
            pageStyles.column,
            { maxHeight: columnHeight },
            !index ? pageStyles.firstColumn : pageStyles.secondColumn,
          ]}
          key={index}
        >
          {rows.map((row, index) =>
            rows.length === itemsPerColumn + 1 && index === rows.length - 1 ? null : (
              <ResponseColumn
                key={row.id}
                row={row}
                showBoldBorder={row.screenIndex !== rows[index + 1]?.screenIndex}
              />
            ),
          )}
        </View>
      ))}
      <View style={pageStyles.verticalDivider} />
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

  const initialItemsPerColumn = surveyResponse.resultText
    ? INITAL_ITEMS_PER_COLUMN_WITH_RESULT
    : INITAL_ITEMS_PER_COLUMN;

  const initialAnswerRows = surveyAnswerRows.slice(0, initialItemsPerColumn * 2 + 1);
  const restAnswerRows = surveyAnswerRows.slice(initialItemsPerColumn * 2);
  const restColumnsPages = Math.ceil(restAnswerRows.length / (ITEMS_PER_COLUMN * 2));

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

        <ColumnsContainer
          answerRows={initialAnswerRows}
          itemsPerColumn={initialItemsPerColumn}
          hasResult={!!surveyResponse.resultText}
        />
        {Array.from({ length: restColumnsPages }).map((_, index) => (
          <ColumnsContainer
            key={index}
            answerRows={restAnswerRows.slice(
              index * (ITEMS_PER_COLUMN * 2),
              (index + 1) * (ITEMS_PER_COLUMN * 2) + 1,
            )}
            itemsPerColumn={ITEMS_PER_COLUMN}
          />
        ))}
        <Footer printFacility={facility?.name} printedBy={currentUser?.displayName} />
      </Page>
    </Document>
  );
};

export const SurveyResponsesPrintout = withLanguageContext(SurveyResponsesPrintoutComponent);
