import React from 'react';
import { Document, Page } from '@react-pdf/renderer';

import { styles, Col, Box, Row, Watermark, CertificateLogo } from '../patientCertificates/Layout';
import { H3, P, CertificateAddress, CertificateTitle} from '../patientCertificates/Typography';
import { Table } from '../patientCertificates/Table';
import { getDOB } from '../patientCertificates/accessors';
import { 
  CertificateHeader,
  CertificateFooter,
  CertificateTypes,
} from '../patientCertificates';

const joinNames = ({ firstName, lastName }) => [firstName, lastName].join(' ');
const PATIENT_FIELDS = [
  { key: 'Patient name', label: 'Patient name', accessor: joinNames },
  {
    key: 'dateOfBirth',
    label: 'DOB',
    accessor: getDOB,
  },
  { key: 'sex', label: 'Sex' },
  { key: 'displayId', label: 'Patient ID' },
];

const PatientDetailsSection = ({ getLocalisation, patient }) => {
  return (
    <Row>
      <Col style={{ marginBottom: 5 }}>
        <Row>
          {PATIENT_FIELDS.map(({ key, label: defaultLabel, accessor }) => {
            const value = (accessor ? accessor(patient, getLocalisation) : patient[key]) || '';
            const label = getLocalisation(`fields.${key}.shortLabel`) || defaultLabel;

            return (
              <Col style={{ width: '33%' }} key={key}>
                <P mb={6}>
                  <P bold>{label}:</P> {value}
                </P>
              </Col>
            );
          })}
        </Row>
      </Col>
    </Row>
  );
};

export const PatientLetter = ({ getLocalisation, patientLetterData }) => {
  console.log(patientLetterData);
  const { title: certificateTitle, patient = {} } = patientLetterData;
  const title = getLocalisation('templates.letterhead.title');
  const subTitle = getLocalisation('templates.letterhead.subTitle');
  const logoSrc = undefined;


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CertificateHeader>
          <>
            {logoSrc && <CertificateLogo logoSrc={logoSrc} />}
            <CertificateAddress>{`${title}\n${subTitle}`}</CertificateAddress>
            <CertificateTitle>{certificateTitle}</CertificateTitle>
          </>
          <PatientDetailsSection
            patient={patient}
            getLocalisation={getLocalisation}
          />
        </CertificateHeader>
      </Page>
    </Document>
  )
};
