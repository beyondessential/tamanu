import React from 'react';
import { Document, View } from '@react-pdf/renderer';

import { CertificateHeader, Col, Row, Signature, styles } from '../patientCertificates/Layout';
import { H3, P } from '../patientCertificates/Typography';
import { LetterheadSection } from '../patientCertificates/LetterheadSection';
import { getDob, getName, getSex } from '../patientAccessors';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { useDateTimeFormat, withDateTimeContext } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';

export const getCreatedAtDate = ({ documentCreatedAt }, { formatShort }) =>
  documentCreatedAt ? formatShort(documentCreatedAt) : 'Unknown';

const DETAIL_FIELDS = [
  { key: 'Patient name', label: 'Patient name', accessor: getName },
  { key: 'displayId', label: 'Patient ID' },
  {
    key: 'dateOfBirth',
    label: 'DOB',
    accessor: getDob,
  },
  { key: 'clinicianName', label: 'Clinician' },
  { key: 'sex', label: 'Sex', accessor: getSex },
  { key: 'documentCreatedAt', label: 'Date', accessor: getCreatedAtDate },
];

const detailsSectionStyle = {
  borderTop: '1 solid #000000',
  borderBottom: '1 solid #000000',
  paddingTop: 4,
  paddingBottom: 5,
  marginBottom: 10,
};

const DetailsSection = ({ getLocalisation, data }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTimeFormat();
  return (
    <View style={{ marginTop: 10 }}>
      <H3 style={{ marginBottom: 5 }}>Details</H3>
      <Row style={detailsSectionStyle}>
        <Col style={{ marginBottom: 5 }}>
          <Row>
            {DETAIL_FIELDS.map(({ key, label: defaultLabel, accessor }) => {
              const value =
                (accessor
                  ? accessor(data, { getLocalisation, getTranslation, formatShort })
                  : data[key]) || '';
              const label =
                getTranslation(`general.localisedField.${key}.label.short`) ||
                getTranslation(`general.localisedField.${key}.label`) ||
                defaultLabel;

              return (
                <Col style={{ width: '50%' }} key={key}>
                  <P mb={6}>
                    <P bold>{label}:</P> {value}
                  </P>
                </Col>
              );
            })}
          </Row>
        </Col>
      </Row>
    </View>
  );
};

const PatientLetterComponent = ({ getLocalisation, data, logoSrc, letterheadConfig }) => {
  const { title: certificateTitle, body, patient = {}, clinician, documentCreatedAt } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection
            logoSrc={logoSrc}
            certificateTitle={certificateTitle ?? ''}
            letterheadConfig={letterheadConfig}
          />
          <DetailsSection
            data={{ ...patient, clinicianName: clinician.displayName, documentCreatedAt }}
            getLocalisation={getLocalisation}
          />
        </CertificateHeader>
        <View style={{ margin: '18px' }}>
          <P mb={60} style={{ fontSize: 12 }}>
            {/* In future, the body should accept markup */}
            {body ?? ''}
          </P>
          <Signature text="Signed" />
        </View>
      </Page>
    </Document>
  );
};

export const PatientLetter = withLanguageContext(withDateTimeContext(PatientLetterComponent));
