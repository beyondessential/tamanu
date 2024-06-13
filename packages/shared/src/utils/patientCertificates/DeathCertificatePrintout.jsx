import PropTypes from 'prop-types';
import React from 'react';

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import {
  getName,
  getTimeOfDeath,
  getDateOfDeath,
  getSex,
  getAddress,
  getNationality,
  getEthnicity,
} from '../patientAccessors';
import { CertificateHeader, Col, Row, styles, SigningImage } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { Footer } from './printComponents/Footer';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { renderDataItems } from './printComponents/renderDataItems';
import { P } from './Typography';
import { getDisplayDate } from './getDisplayDate';
import { DataSection } from './printComponents/DataSection';

const borderStyle = '1 solid black';
const tableLabelWidth = 200;
const tablePadding = 10;
const dataColPadding = 10;

const generalStyles = StyleSheet.create({
  container: {
    // marginHorizontal: 16,
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
  <View style={[generalStyles.container, generalStyles.tableContainer]} {...props} />
);

const infoBoxStyles = StyleSheet.create({
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
    fontFamily: 'Helvetica',
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
    width: 175,
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

const signStyles = StyleSheet.create({
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

const formatMinutes = minutes => {
  if (minutes === undefined) return null;

  if (minutes < 60) {
    return minutes + ' minutes';
  } else if (minutes < 1440) {
    return Math.floor(minutes / 60) + ' hours';
  } else {
    return Math.floor(minutes / 1440) + ' days';
  }
};

const InfoBoxRow = props => <View style={infoBoxStyles.row} {...props} />;

const InfoBoxLabelCol = props => <View style={infoBoxStyles.labelCol} {...props} />;

const UnderlinedText = ({ text, style, props }) => (
  <View style={{ ...infoBoxStyles.infoText, ...infoBoxStyles.underlinedText, ...style }} {...props}>
    <Text>{text}</Text>
  </View>
);

const CauseField = ({ cause, label, helperText, ...props }) => {
  return (
    <View {...props}>
      <Row>
        {label && <Text style={infoBoxStyles.infoText}>({label}) </Text>}
        <UnderlinedText text={cause.name}> </UnderlinedText>
        <UnderlinedText
          text={formatMinutes(cause.timeAfterOnset)}
          style={{ width: 85, marginLeft: 10 }}
        />
      </Row>
      {helperText && (
        <Text style={[infoBoxStyles.infoText, infoBoxStyles.smallMarginTop]}>{helperText}</Text>
      )}
    </View>
  );
};
const InfoBoxDataCol = props => <View style={infoBoxStyles.dataCol} {...props} />;

const AuthorisedAndSignSection = () => (
  <View style={signStyles.container}>
    <View style={signStyles.row}>
      <P style={signStyles.text}>Authorised by (print name):</P>
      <View style={signStyles.line} />
    </View>
    <View style={signStyles.row}>
      <View style={signStyles.leftCol}>
        <Text style={signStyles.text}>Signed: </Text>
        <View style={signStyles.line} />
      </View>
      <View style={signStyles.rightCol}>
        <Text style={signStyles.text}>Date:</Text>
        <View style={signStyles.line} />
      </View>
    </View>
  </View>
);

const placeOfDeathAccessor = ({ facility }) => {
  return facility?.name;
};

const getCauseName = cause => cause?.condition?.name;

const getCauseInfo = cause => {
  const name = cause?.condition?.name;
  const timeAfterOnset = cause?.timeAfterOnset;
  return { name, timeAfterOnset };
};

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
    { key: 'nationality', label: 'Nationality', accessor: getNationality },
    { key: 'address', label: 'Address', accessor: getAddress },
    { key: 'printedBy', label: 'Printed by' },
  ],
  rightCol: [
    { key: 'lastName', label: 'Last name' },
    { key: 'sex', label: 'Sex', accessor: getSex },
  ],
};

const PATIENT_DETAIL_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'nationality', label: 'Nationality', accessor: getNationality },
    { key: 'address', label: 'Address', accessor: getAddress },
  ],
  rightCol: [
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDOB },
    { key: 'ethnicity', label: 'Ethnicity', accessor: getEthnicity },
  ],
};

const PATIENT_DEATH_DETAILS = {
  leftCol: [
    { key: 'deathDate', label: 'Date of death', accessor: getDateOfDeath },
    { key: 'timeOfDeath', label: 'Time of death', accessor: getTimeOfDeath },
    { key: 'placeOfDeath', label: 'Place of death', accessor: placeOfDeathAccessor },
  ],
  rightCol: [
    { key: 'causeOfDeath', label: 'Cause of death', accessor: causeOfDeathAccessor },
    // { key: }
  ],
};

const SectionContainer = props => <View style={generalStyles.sectionContainer} {...props} />;

export const DeathCertificatePrintout = React.memo(
  ({ patientData, certificateData, getLocalisation }) => {
    const { logo, deathCertFooterImg } = certificateData;

    const { causes } = patientData;
    console.log(causes);
    const causeOfDeath = getCauseInfo(causes?.primary);
    const antecedentCause1 = getCauseInfo(causes?.antecedent1);
    const antecedentCause2 = getCauseInfo(causes?.antecedent2);
    const antecedentCause3 = getCauseInfo(causes?.antecedent3);
    console.log(patientData);
    return (
      <Document>
        <Page size="A4" style={{ ...styles.page, paddingBottom: 25 }}>
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
              <DataSection title="Patient details">
                <Col>
                  {renderDataItems(PATIENT_DETAIL_FIELDS.leftCol, patientData, getLocalisation, 12)}
                </Col>
                <Col>
                  {renderDataItems(
                    PATIENT_DETAIL_FIELDS.rightCol,
                    patientData,
                    getLocalisation,
                    12,
                  )}
                </Col>
              </DataSection>
            </SectionContainer>
          </CertificateHeader>
          <TableContainer>
            <InfoBoxRow>
              <InfoBoxLabelCol>
                <Text style={infoBoxStyles.boldText}>
                  I {'\n'}
                  Disease or condition directly {'\n'}
                  leading to death*
                </Text>
                <Text style={[infoBoxStyles.italicBoldText, infoBoxStyles.marginTop]}>
                  Antecedent Causes
                </Text>
                <Text style={infoBoxStyles.infoText}>
                  Morbid conditions, if any,{'\n'}
                  giving rise to the above cause,{'\n'}
                  stating the underlying{'\n'}
                  condition last
                </Text>
              </InfoBoxLabelCol>
              <InfoBoxDataCol>
                <CauseField
                  style={infoBoxStyles.mediumMarginTop}
                  label="a"
                  helperText="due to (or as a consequence of)"
                  cause={causeOfDeath}
                />
                <CauseField
                  style={infoBoxStyles.mediumMarginTop}
                  label="b"
                  helperText="due to (or as a consequence of)"
                  cause={antecedentCause1}
                />
                <CauseField
                  style={infoBoxStyles.mediumMarginTop}
                  label="c"
                  helperText="due to (or as a consequence of)"
                  cause={antecedentCause2}
                />
                <CauseField
                  style={infoBoxStyles.mediumMarginTop}
                  label="d"
                  cause={antecedentCause3}
                />
              </InfoBoxDataCol>
            </InfoBoxRow>
            <InfoBoxRow>
              <InfoBoxLabelCol>
                <Text style={infoBoxStyles.boldText}>
                  II {'\n'}
                  Other significant conditions {'\n'}
                  contributing to the death but{'\n'}
                  not related to the disease or{'\n'}
                  condition causing it.{'\n'}
                </Text>
              </InfoBoxLabelCol>
              <InfoBoxDataCol>
                {causes?.contributing?.map((cause, index) => (
                  <CauseField
                    style={
                      causes?.contributing.length < 3
                        ? infoBoxStyles.mediumMarginTop
                        : infoBoxStyles.smallMarginTop
                    }
                    key={index}
                    cause={getCauseInfo(cause)}
                  />
                ))}
              </InfoBoxDataCol>
            </InfoBoxRow>
          </TableContainer>
          <View style={generalStyles.container}>
            <Text style={infoBoxStyles.italicText}>
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

DeathCertificatePrintout.propTypes = {
  patientData: PropTypes.object.isRequired,
  certificateData: PropTypes.object.isRequired,
};
