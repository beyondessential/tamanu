import React from 'react';
import { Col, LightDivider, Row } from './Layout';
import { H3, P } from './Typography';
import { getDOB, getSex } from '../patientAccessors';

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
  { key: 'villageName', label: 'Village' },
];

export const PatientDetailsSection = ({ patient, getSetting, extraFields = [] }) => {
  const detailsToDisplay = [...PATIENT_FIELDS, ...extraFields].filter(
    ({ key }) => !getSetting(`fields.${key}.hidden`),
  );
  return (
    <>
      <H3 style={{ marginBottom: 0 }}>Patient Details</H3>
      <LightDivider />
      <Row>
        <Col style={{ marginBottom: 5 }}>
          <Row>
            {detailsToDisplay.map(({ key, label: defaultLabel, accessor }) => {
              const value = (accessor ? accessor(patient, getSetting) : patient[key]) || '';
              const label = getSetting(`fields.${key}.shortLabel`) || defaultLabel;

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
      <LightDivider />
    </>
  );
};
