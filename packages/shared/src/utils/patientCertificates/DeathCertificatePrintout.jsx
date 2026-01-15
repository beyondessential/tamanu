import PropTypes from 'prop-types';
import React from 'react';

import { Document, StyleSheet, View } from '@react-pdf/renderer';
import {
  getName,
  getTimeOfDeath,
  getDateOfDeath,
  getSex,
  getAddress,
  getNationality,
  getEthnicity,
  getClinician,
  getVillage,
} from '../patientAccessors';
import { CertificateHeader, Col, Row, styles, SigningImage } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { Footer } from './printComponents/Footer';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { renderDataItems } from './printComponents/renderDataItems';
import { P } from './Typography';
import { DataSection } from './printComponents/DataSection';
import { withLanguageContext, useLanguageContext } from '../pdf/languageContext';
import { withDateTimeContext, useDateTimeFormat } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { formatDistanceStrict, milliseconds } from 'date-fns';

const borderStyle = '1 solid black';
const tableLabelWidth = 200;
const tablePadding = 10;
const dataColPadding = 10;

const generalStyles = StyleSheet.create({
  container: {
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
    fontSize: 12,
  },
  infoText: {
    fontSize: 12,
  },
  italicBoldText: {
    fontStyle: 'italic',
    fontSize: 12,
    fontWeight: 700,
  },
  italicText: {
    fontSize: 12,
    fontWeight: 400,
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
  },
  text: {
    fontSize: 12,
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
          text={formatDistanceStrict(0, milliseconds({ minutes: cause.timeAfterOnset }))}
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

const AuthorisedAndSignSection = () => {
  const { getTranslation } = useLanguageContext();

  return (
    <View style={signStyles.container}>
      <View style={signStyles.row}>
        <P bold style={signStyles.text}>
          {getTranslation(
            'pdf.deathCertificate.signature.authorisedBy',
            'Authorised by (print name)',
          )}
          :
        </P>
        <View style={signStyles.line} />
      </View>
      <View style={signStyles.row}>
        <View style={signStyles.leftCol}>
          <Text bold style={signStyles.text}>
            {getTranslation('pdf.deathCertificate.signature.signed', 'Signed')}:{' '}
          </Text>
          <View style={signStyles.line} />
        </View>
        <View style={signStyles.rightCol}>
          <Text bold style={signStyles.text}>
            {getTranslation('pdf.deathCertificate.signature.date', 'Date')}:
          </Text>
          <View style={signStyles.line} />
        </View>
      </View>
    </View>
  );
};

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
const getDob = ({ dateOfBirth }, { getTranslation, formatCustom }) =>
  dateOfBirth
    ? formatCustom(dateOfBirth, 'd MMM yyyy')
    : getTranslation('general.fallback.unknown', 'Unknown');

const getDateAndTimeOfDeath = (patientData, getLocalisation, getTranslation) => {
  return `${getDateOfDeath(patientData, {
    getLocalisation,
    getTranslation,
  })} ${getTimeOfDeath(patientData, { getLocalisation, getTranslation })}`;
};

const PATIENT_DETAIL_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'nationalityId', label: 'Nationality', accessor: getNationality },
    { key: 'address', label: 'Address', accessor: getAddress },
  ],
  rightCol: [
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDob },
    { key: 'ethnicityId', label: 'Ethnicity', accessor: getEthnicity },
    { key: 'villageId', label: 'Village', accessor: getVillage },
  ],
};

const PATIENT_DEATH_DETAILS = {
  leftCol: [
    { key: 'deathDateAndTime', label: 'Date & time of death', accessor: getDateAndTimeOfDeath },
    { key: 'placeOfDeath', label: 'Place of death', accessor: placeOfDeathAccessor },
  ],
  rightCol: [
    { key: 'causeOfDeath', label: 'Cause of death', accessor: causeOfDeathAccessor },
    { key: 'attendingClinician', label: 'Attending clinician', accessor: getClinician },
  ],
};

const SectionContainer = props => <View style={generalStyles.sectionContainer} {...props} />;

const DeathCertificatePrintoutComponent = React.memo(
  ({ patientData, certificateData, getLocalisation }) => {
    const { getTranslation } = useLanguageContext();
    const { formatShort, formatCustom, formatTime } = useDateTimeFormat();
    const { logo, deathCertFooterImg } = certificateData;

    const { causes } = patientData;
    const causeOfDeath = getCauseInfo(causes?.primary);
    const antecedentCause1 = getCauseInfo(causes?.antecedent1);
    const antecedentCause2 = getCauseInfo(causes?.antecedent2);
    const antecedentCause3 = getCauseInfo(causes?.antecedent3);
    return (
      <Document>
        <Page size="A4" style={{ ...styles.page, paddingBottom: 25 }}>
          <MultiPageHeader
            documentName={getTranslation(
              'pdf.deathCertificate.title',
              'Cause of death certificate',
            )}
            patientName={getName(patientData)}
            patientId={patientData.displayId}
          />
          <CertificateHeader>
            <LetterheadSection
              logoSrc={logo}
              letterheadConfig={certificateData}
              certificateTitle={getTranslation(
                'pdf.deathCertificate.title',
                'Cause of death certificate',
              )}
            />
            <SectionContainer>
              <DataSection
                title={getTranslation(
                  'pdf.deathCertificate.section.patientDetails',
                  'Patient details',
                )}
                hideBottomRule
              >
                <Col>
                  {renderDataItems(
                    PATIENT_DETAIL_FIELDS.leftCol,
                    patientData,
                    { getLocalisation, getTranslation, formatShort, formatCustom, formatTime },
                    12,
                  )}
                </Col>
                <Col>
                  {renderDataItems(
                    PATIENT_DETAIL_FIELDS.rightCol,
                    patientData,
                    { getLocalisation, getTranslation, formatShort, formatCustom, formatTime },
                    12,
                  )}
                </Col>
              </DataSection>
              <DataSection title="">
                <Col>
                  {renderDataItems(
                    PATIENT_DEATH_DETAILS.leftCol,
                    patientData,
                    { getLocalisation, getTranslation, formatShort, formatCustom, formatTime },
                    12,
                  )}
                </Col>
                <Col>
                  {renderDataItems(
                    PATIENT_DEATH_DETAILS.rightCol,
                    patientData,
                    { getLocalisation, getTranslation, formatShort, formatCustom, formatTime },
                    12,
                  )}
                </Col>
              </DataSection>
            </SectionContainer>
          </CertificateHeader>
          <TableContainer>
            <InfoBoxRow>
              <InfoBoxLabelCol>
                <Text bold style={infoBoxStyles.boldText}>
                  {getTranslation('pdf.deathCertificate.causeOfDeath.primary.label.1', 'I')}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.causeOfDeath.primary.label.2',
                    'Disease or condition directly',
                  )}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.causeOfDeath.primary.label.3',
                    'leading to death*',
                  )}
                </Text>
                <Text bold style={[infoBoxStyles.italicBoldText, infoBoxStyles.marginTop]}>
                  {getTranslation(
                    'pdf.deathCertificate.antecedentCauses.label',
                    'Antecedent Causes',
                  )}
                </Text>
                <Text style={infoBoxStyles.infoText}>
                  {getTranslation(
                    'pdf.deathCertificate.antecedentCauses.description.1',
                    'Morbid conditions, if any,',
                  )}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.antecedentCauses.description.2',
                    'giving rise to the above cause,',
                  )}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.antecedentCauses.description.3',
                    'stating the underlying',
                  )}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.antecedentCauses.description.4',
                    'condition last',
                  )}
                </Text>
              </InfoBoxLabelCol>
              <InfoBoxDataCol>
                <CauseField
                  style={infoBoxStyles.mediumMarginTop}
                  label="a"
                  helperText={getTranslation(
                    'pdf.deathCertificate.antecedentCauses.dueTo',
                    'due to (or as a consequence of)',
                  )}
                  cause={causeOfDeath}
                />
                <CauseField
                  style={infoBoxStyles.mediumMarginTop}
                  label="b"
                  helperText={getTranslation(
                    'pdf.deathCertificate.antecedentCauses.dueTo',
                    'due to (or as a consequence of)',
                  )}
                  cause={antecedentCause1}
                />
                <CauseField
                  style={infoBoxStyles.mediumMarginTop}
                  label="c"
                  helperText={getTranslation(
                    'pdf.deathCertificate.antecedentCauses.dueTo',
                    'due to (or as a consequence of)',
                  )}
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
                <Text bold style={infoBoxStyles.boldText}>
                  {getTranslation('pdf.deathCertificate.contributingCauses.label.1', 'II')}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.contributingCauses.label.2',
                    'Other significant conditions',
                  )}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.contributingCauses.label.3',
                    'contributing to the death but',
                  )}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.contributingCauses.label.4',
                    'not related to the disease or',
                  )}
                  {'\n'}
                  {getTranslation(
                    'pdf.deathCertificate.contributingCauses.label.5',
                    'condition causing it.',
                  )}
                  {'\n'}
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
              {getTranslation(
                'pdf.deathCertificate.causeOfDeath.note',
                '* This does not mean the mode of dying, e.g heart failure, respiratory failure. It means the disease, injury, or complication that caused death.',
              )}
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

export const DeathCertificatePrintout = withLanguageContext(
  withDateTimeContext(DeathCertificatePrintoutComponent),
);

DeathCertificatePrintout.propTypes = {
  patientData: PropTypes.object.isRequired,
  certificateData: PropTypes.object.isRequired,
};
