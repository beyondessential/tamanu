import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';

import { styles, Col, Row, Signature, CertificateHeader } from '../patientCertificates/Layout';
import { H3, P } from '../patientCertificates/Typography';
import { LetterheadSection } from '../patientCertificates/LetterheadSection';
import { getSex, getName, getDOB } from '../patientAccessors';
import { format as formatDate } from '../dateTime';

export const getCreatedAtDate = ({ documentCreatedAt }) =>
  documentCreatedAt ? formatDate(documentCreatedAt, 'dd/MM/yyyy') : 'Unknown';

const DETAIL_FIELDS = [
  { key: 'Patient name', label: 'Patient name', accessor: getName },
  { key: 'displayId', label: 'Patient ID' },
  {
    key: 'dateOfBirth',
    label: 'DOB',
    accessor: getDOB,
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
  return (
    <View style={{ marginTop: 10 }}>
      <H3 style={{ marginBottom: 5 }}>Details</H3>
      <Row style={detailsSectionStyle}>
        <Col style={{ marginBottom: 5 }}>
          <Row>
            {DETAIL_FIELDS.map(({ key, label: defaultLabel, accessor }) => {
              const value = (accessor ? accessor(data, getLocalisation) : data[key]) || '';
              const label = getLocalisation(`fields.${key}.shortLabel`) || defaultLabel;

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

export const PatientLetter = ({ getLocalisation, data, logoSrc, letterheadConfig }) => {
  const { title: certificateTitle, body, patient = {}, clinician, documentCreatedAt } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logoSrc}
            certificateTitle={certificateTitle ?? ''}
            overrideLetterhead={letterheadConfig}
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
