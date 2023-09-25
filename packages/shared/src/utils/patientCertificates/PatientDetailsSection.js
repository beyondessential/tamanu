import React from 'react';
import { Col, Row } from './Layout';
import { P } from './Typography';
import { getDOB, getNationality, getPassportNumber } from '../patientAccessors';

const PATIENT_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  {
    key: 'dateOfBirth',
    label: 'Date Of Birth',
    accessor: getDOB,
  },
  { key: 'sex', label: 'Sex' },
  { key: 'displayId', label: 'NHN' },
  { key: 'passport', label: 'Passport Number', accessor: getPassportNumber },
  { key: 'nationality', label: 'Nationality', accessor: getNationality },
];

export const PatientDetailsSection = ({ patient, getSetting, extraFields = [] }) => {
  const detailsToDisplay = [...PATIENT_FIELDS, ...extraFields].filter(
    ({ key }) => !getSetting(`fields.${key}.hidden`),
  );
  return (
    <Row>
      <Col style={{ marginBottom: 5 }}>
        <Row>
          {detailsToDisplay.map(({ key, label: defaultLabel, accessor }) => {
            const value = (accessor ? accessor(patient, getSetting) : patient[key]) || '';
            const label = getSetting(`fields.${key}.shortLabel`) || defaultLabel;

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
