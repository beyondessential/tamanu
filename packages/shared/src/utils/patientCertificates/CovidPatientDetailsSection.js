import React from 'react';
import { Col, Row, VDSImage } from './Layout';
import { P } from './Typography';
import { getDOB, getNationality, getPassportNumber } from './accessors';

const PATIENT_FIELDS = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  {
    key: 'dateOfBirth',
    label: 'Date of birth',
    accessor: getDOB,
  },
  { key: 'sex', label: 'Sex' },
  { key: 'displayId', label: 'NHN' },
  { key: 'passport', label: 'Passport number', accessor: getPassportNumber },
  { key: 'nationality', label: 'Nationality', accessor: getNationality },
];

export const CovidPatientDetailsSection = ({
  patient,
  getLocalisation,
  vdsSrc,
  extraFields = [],
  uvci,
}) => {
  const detailsToDisplay = [...PATIENT_FIELDS, ...extraFields].filter(
    ({ key }) => !getLocalisation(`fields.${key}.hidden`),
  );

  const leftWidth = vdsSrc ? 68 : 80;
  const rightWidth = 100 - leftWidth;

  return (
    <Row>
      <Col style={{ width: `${leftWidth}%` }}>
        <Row>
          {detailsToDisplay.map(({ key, label: defaultLabel, accessor }) => {
            const value = (accessor ? accessor(patient, getLocalisation) : patient[key]) || '';
            const label = getLocalisation(`fields.${key}.shortLabel`) || defaultLabel;

            return (
              <Col key={key}>
                <P mb={5}>
                  <P bold>{label}:</P> {value}
                </P>
              </Col>
            );
          })}
        </Row>
        {uvci && (
          <Row>
            <P>
              <P bold>UVCI:</P> {uvci}
            </P>
          </Row>
        )}
      </Col>
      <Col style={{ width: `${rightWidth}%` }}>{vdsSrc && <VDSImage src={vdsSrc} />}</Col>
    </Row>
  );
};
