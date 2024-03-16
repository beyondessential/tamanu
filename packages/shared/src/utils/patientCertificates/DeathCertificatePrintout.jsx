import PropTypes from 'prop-types';
import React from 'react';

import { Document, Page, Text, View } from '@react-pdf/renderer';
import { getName, getTimeOfDeath, getDateOfDeath, getSex } from '../patientAccessors';
import { CertificateHeader, Col, Row, styles, SigningImage } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { Footer } from './printComponents/Footer';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { renderDataItems } from './printComponents/renderDataItems';
import { P } from './Typography';
import { getDisplayDate } from './getDisplayDate';
import { CustomStyleSheet } from '../renderPdf';
import { useLanguageContext, withLanguageContext } from '../languageContext';

const borderStyle = '1 solid black';
const tableLabelWidth = 250;
const tablePadding = 10;
const dataColPadding = 10;

const generalStyles = CustomStyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tableContainer: {
    marginTop: 30,
  },
  sectionContainer: {
    marginVertical: 7,
  },
});

const TableContainer = props => (
  <View style={[generalStyles().container, generalStyles().tableContainer]} {...props} />
);

const infoBoxStyles = CustomStyleSheet.create({
  row: {
    flexDirection: 'row',
    border: borderStyle,
    marginBottom: -1,
  },
  labelCol: {
    width: tableLabelWidth,
    padding: tablePadding,
  },
  dataCol: {
    flex: 1,
    padding: dataColPadding,
    paddingBottom: 30,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    fontWeight: 500,
  },
  infoText: {
    fontSize: 12,
    fontWeight: 400,
  },
  italicBoldText: {
    fontFamily: 'Helvetica-BoldOblique',
    fontSize: 12,
    fontWeight: 500,
  },
  italicText: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 12,
    fontWeight: 500,
  },
  underlinedText: {
    borderBottom: borderStyle,
    width: 200,
  },
  marginTop: {
    marginTop: 50,
  },
  mediumMarginTop: {
    marginTop: 30,
  },
  smallMarginTop: {
    marginTop: 5,
  },
});

const signStyles = CustomStyleSheet.create({
  container: {
    paddingBottom: 20,
    marginVertical: 30,
    marginHorizontal: 16,
  },
  text: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1,
  },
  line: {
    flex: 1,
    borderBottom: '1 solid black',
    height: 14,
    marginLeft: 5,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 20,
  },
  leftCol: {
    flexDirection: 'row',
    width: 300,
    paddingRight: 20,
  },
  rightCol: {
    flexDirection: 'row',
    flex: 1,
  },
});

const InfoBoxRow = props => <View style={infoBoxStyles().row} {...props} />;
const InfoBoxLabelCol = props => <View style={infoBoxStyles().labelCol} {...props} />;
const UnderlinedText = ({ text, ...props }) => (
  <View style={[infoBoxStyles().infoText, infoBoxStyles().underlinedText]} {...props}>
    <Text>{text}</Text>
  </View>
);
const UnderlinedField = ({ text, label, helperText, ...props }) => (
  <View {...props}>
    <Row>
      {label && <Text style={infoBoxStyles().infoText}>({label}) </Text>}
      <UnderlinedText text={text}> </UnderlinedText>
    </Row>
    {helperText && (
      <Text style={[infoBoxStyles().infoText, infoBoxStyles().smallMarginTop]}>
        {helperText}
      </Text>
    )}
  </View>
);
const InfoBoxDataCol = props => <View style={infoBoxStyles().dataCol} {...props} />;

const AuthorisedAndSignSection = () => {
  const { language } = useLanguageContext();
  return (
    <View style={signStyles().container}>
      <View style={signStyles().row}>
        <P style={signStyles(language).text}>Authorised by (print name):</P>
        <View style={signStyles().line} />
      </View>
      <View style={signStyles().row}>
        <View style={signStyles().leftCol}>
          <Text style={signStyles(language).text}>Signed: </Text>
          <View style={signStyles().line} />
        </View>
        <View style={signStyles().rightCol}>
          <Text style={signStyles(language).text}>Date:</Text>
          <View style={signStyles().line} />
        </View>
      </View>
    </View>
  );
};

const placeOfDeathAccessor = ({ facility }) => {
  return facility?.name;
};

const getCauseName = cause => cause?.condition?.name;

const causeOfDeathAccessor = ({ causes }) => {
  return getCauseName(causes?.primary);
};

// Death certificate has a slightly different DOB format to other certificates so needs its own accessor
const getDOB = ({ dateOfBirth }, getLocalisation) =>
  dateOfBirth ? getDisplayDate(dateOfBirth, 'd MMM yyyy', getLocalisation) : 'Unknown';

const HEADER_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First name' },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDOB },
    { key: 'deathDate', label: 'Date of death', accessor: getDateOfDeath },
    { key: 'timeOfDeath', label: 'Time of death', accessor: getTimeOfDeath },
    { key: 'printedBy', label: 'Printed by' },
  ],
  rightCol: [
    { key: 'lastName', label: 'Last name' },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'placeOfDeath', label: 'Place of death', accessor: placeOfDeathAccessor },
    { key: 'causeOfDeath', label: 'Cause of death', accessor: causeOfDeathAccessor },
  ],
};

const SectionContainer = props => <View style={generalStyles().sectionContainer} {...props} />;

const DeathCertificatePrintoutComponent = React.memo(
  ({ patientData, certificateData, getLocalisation }) => {
    const { language } = useLanguageContext();
    const { logo, deathCertFooterImg } = certificateData;

    const { causes } = patientData;
    const causeOfDeath = getCauseName(causes?.primary);
    const antecedentCause1 = getCauseName(causes?.antecedent1);
    const antecedentCause2 = getCauseName(causes?.antecedent2);
    return (
      <Document>
        <Page size="A4" style={{ ...styles(language).page, paddingBottom: 25 }}>
          <MultiPageHeader
            documentName="Cause of death certificate"
            patientName={getName(patientData)}
            patientId={patientData.displayId}
          />
          <CertificateHeader>
            <LetterheadSection
              getLocalisation={getLocalisation}
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle="Cause of death certificate"
            />
            <SectionContainer>
              <Row>
                <Col>
                  {renderDataItems(
                    HEADER_FIELDS.leftCol,
                    { ...certificateData, ...patientData },
                    getLocalisation,
                    12,
                  )}
                </Col>
                <Col>
                  {renderDataItems(
                    HEADER_FIELDS.rightCol,
                    { ...certificateData, ...patientData },
                    getLocalisation,
                    12,
                  )}
                </Col>
              </Row>
            </SectionContainer>
          </CertificateHeader>
          <TableContainer>
            <InfoBoxRow>
              <InfoBoxLabelCol>
                <Text style={infoBoxStyles(language).boldText}>
                  I {'\n'}
                  Disease or condition directly {'\n'}
                  leading to death*
                </Text>
                <Text style={[infoBoxStyles(language).italicBoldText, infoBoxStyles().marginTop]}>
                  Antecedent Causes
                </Text>
                <Text style={infoBoxStyles().infoText}>
                  Morbid conditions, if any,{'\n'}
                  giving rise to the above cause,{'\n'}
                  stating the underlying{'\n'}
                  condition last
                </Text>
              </InfoBoxLabelCol>
              <InfoBoxDataCol>
                <UnderlinedField
                  style={infoBoxStyles().mediumMarginTop}
                  label="a"
                  helperText="due to (or as a consequence of)"
                  text={causeOfDeath}
                ></UnderlinedField>
                <UnderlinedField
                  style={infoBoxStyles().mediumMarginTop}
                  label="b"
                  helperText="due to (or as a consequence of)"
                  text={antecedentCause1}
                ></UnderlinedField>
                <UnderlinedField
                  style={infoBoxStyles().mediumMarginTop}
                  label="c"
                  text={antecedentCause2}
                ></UnderlinedField>
              </InfoBoxDataCol>
            </InfoBoxRow>
            <InfoBoxRow>
              <InfoBoxLabelCol>
                <Text style={infoBoxStyles(language).boldText}>
                  II {'\n'}
                  Other significant conditions {'\n'}
                  contributing to the death but{'\n'}
                  not related to the disease or{'\n'}
                  condition causing it.{'\n'}
                </Text>
              </InfoBoxLabelCol>
              <InfoBoxDataCol>
                {causes?.contributing?.map((cause, index) => (
                  <UnderlinedField
                    style={
                      causes?.contributing.length < 3
                        ? infoBoxStyles().mediumMarginTop
                        : infoBoxStyles().smallMarginTop
                    }
                    key={index}
                    text={getCauseName(cause)}
                  ></UnderlinedField>
                ))}
              </InfoBoxDataCol>
            </InfoBoxRow>
          </TableContainer>
          <View style={generalStyles().container}>
            <Text style={infoBoxStyles(language).italicText}>
              * This does not mean the mode of dying, e.g heart failure, respiratory failure. It
              means the disease, injury, or complication that caused death.
            </Text>
          </View>
          {deathCertFooterImg ? (
            <SigningImage src={deathCertFooterImg} />
          ) : (
            <AuthorisedAndSignSection />
          )}
          <Footer />
        </Page>
      </Document>
    );
  },
);

export const DeathCertificatePrintout = withLanguageContext(DeathCertificatePrintoutComponent);

DeathCertificatePrintout.propTypes = {
  patientData: PropTypes.object.isRequired,
  certificateData: PropTypes.object.isRequired,
};
