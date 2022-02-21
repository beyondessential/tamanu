import React from 'react';
import { Col, Row, VDSImage } from './Layout';
import { P } from './Typography';
import { getDOB, getCountryOfBirth, getPlaceOfBirth } from './accessors';

const PATIENT_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  {
    key: 'dateOfBirth',
    label: 'Date Of Birth',
    accessor: getDOB,
  },
  {
    key: 'placeOfBirth',
    label: 'Place Of Birth',
    accessor: getPlaceOfBirth,
  },
  {
    key: 'countryOfBirth',
    label: 'Country Of Birth',
    accessor: getCountryOfBirth,
  },
  { key: 'sex', label: 'Sex' },
  { key: 'displayId', label: 'NHN' },
];

export const PatientDetailsSection = ({ patient, getLocalisation, vdsSrc }) => {
  const detailsToDisplay = PATIENT_FIELDS.filter(
    ({ key }) => getLocalisation(`fields.${key}.hidden`) !== true,
  );
  return (
    <Row>
      <Col style={{ width: '80%' }}>
        <Row>
          {detailsToDisplay.map(({ key, label: defaultLabel, accessor }) => {
            const value = (accessor ? accessor(patient) : patient[key]) || '';
            const label = getLocalisation(`fields.${key}.shortLabel`) || defaultLabel;

            return (
              <Col key={key}>
                <P>{`${label}: ${value}`}</P>
              </Col>
            );
          })}
        </Row>
      </Col>
      <Col style={{ width: '20%' }}>{vdsSrc && <VDSImage src={vdsSrc} />}</Col>
    </Row>
  );
};
