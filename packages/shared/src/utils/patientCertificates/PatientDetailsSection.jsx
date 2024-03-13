import React from 'react';
import { Col, LightDivider, Row } from './Layout';
import { H3, P } from './Typography';
import {
  getDOB,
  getSex,
  getVillageName,
  getNationality,
  getPassportNumber,
} from '../patientAccessors';

const PATIENT_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'displayId', label: 'Patient ID' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'sex', label: 'Sex', accessor: getSex },
  {
    key: 'dateOfBirth',
    label: 'DOB',
    accessor: getDOB,
  },
  { key: 'villageName', label: 'Village', accessor: getVillageName },
  { key: 'passport', label: 'Passport Number', accessor: getPassportNumber },
  { key: 'nationality', label: 'Nationality', accessor: getNationality },
];

export const PatientDetailsSection = ({ patient, getLocalisation, extraFields = [], language }) => {
  const detailsToDisplay = [...PATIENT_FIELDS, ...extraFields].filter(
    ({ key }) => !getLocalisation(`fields.${key}.hidden`),
  );
  return (
    <>
      <H3 style={{ marginBottom: 0 }} language={language}>Patient Details</H3>
      <LightDivider />
      <Row>
        <Col style={{ marginBottom: 5 }}>
          <Row>
            {detailsToDisplay.map(({ key, label: defaultLabel, accessor }) => {
              const value = (accessor ? accessor(patient, getLocalisation) : patient[key]) || '';
              const label = getLocalisation(`fields.${key}.shortLabel`) || defaultLabel;

              return (
                <Col style={{ width: '50%' }} key={key}>
                  <P language={language} mb={6} fontSize={9}>
                    <P language={language} bold fontSize={9}>
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
