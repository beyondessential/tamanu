import React from 'react';
import { Col, LightDivider, Row } from './Layout';
import { H3, P } from './Typography';
import { getDobWithAge, getSex, getVillageName } from '../patientAccessors';
import { useLanguageContext } from '../pdf/languageContext';

const patientFields = getTranslation => [
  {
    key: 'firstName',
    label: getTranslation('pdf.vaccineCertificate.patientDetails.firstName', 'First Name'),
  },
  {
    key: 'displayId',
    label: getTranslation('pdf.vaccineCertificate.patientDetails.patientId', 'Patient ID'),
  },
  {
    key: 'lastName',
    label: getTranslation('pdf.vaccineCertificate.patientDetails.lastName', 'Last Name'),
  },
  {
    key: 'sex',
    label: getTranslation('pdf.vaccineCertificate.patientDetails.sex', 'Sex'),
    accessor: getSex,
  },
  {
    key: 'dateOfBirth',
    label: getTranslation('pdf.vaccineCertificate.patientDetails.dob', 'DOB'),
    accessor: getDobWithAge,
  },
  {
    key: 'villageName',
    label: getTranslation('pdf.vaccineCertificate.patientDetails.village', 'Village'),
    accessor: getVillageName,
  },
];

export const PatientDetailsSection = ({
  patient,
  getLocalisation,
  getSetting,
  extraFields = [],
}) => {
  const { getTranslation } = useLanguageContext();

  const detailsToDisplay = [...patientFields(getTranslation), ...extraFields].filter(
    ({ key }) => !getSetting(`fields.${key}.hidden`),
  );
  return (
    <>
      <H3 style={{ marginBottom: 0 }}>
        {getTranslation('pdf.vaccineCertificate.patientDetails.title', 'Patient Details')}
      </H3>
      <LightDivider />
      <Row>
        <Col style={{ marginBottom: 5 }}>
          <Row>
            {detailsToDisplay.map(({ key, label: defaultLabel, accessor }) => {
              const value =
                (accessor
                  ? accessor(patient, { getLocalisation, getTranslation, getSetting })
                  : patient[key]) || '';
              const label =
                getTranslation(`general.localisedField.${key}.label.short`) ||
                getTranslation(`general.localisedField.${key}.label`) ||
                defaultLabel;

              return (
                <Col style={{ width: '50%' }} key={key}>
                  <P mb={6} fontSize={9}>
                    <P bold fontSize={9}>
                      {label}:
                    </P>{' '}
                    {value}
                  </P>
                </Col>
              );
            })}
          </Row>
        </Col>
      </Row>
      <LightDivider />
    </>
  );
};
