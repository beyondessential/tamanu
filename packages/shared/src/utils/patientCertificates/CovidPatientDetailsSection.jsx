import React from 'react';
import { Col, Row, VDSImage } from './Layout';
import { P } from './Typography';
import { getDobWithAge, getNationality, getPassportNumber } from '../patientAccessors';
import { useLanguageContext } from '../pdf/languageContext';
import { useDateTime } from '../pdf/withDateTimeContext';

const PATIENT_FIELDS = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  {
    key: 'dateOfBirth',
    label: 'Date of birth',
    accessor: getDobWithAge,
  },
  { key: 'sex', label: 'Sex' },
  { key: 'displayId', label: 'NHN' },
  { key: 'passport', label: 'Passport number', accessor: getPassportNumber },
  { key: 'nationality', label: 'Nationality', accessor: getNationality },
];

export const CovidPatientDetailsSection = ({
  patient,
  getSetting,
  vdsSrc,
  extraFields = [],
  uvci,
}) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTime();
  const detailsToDisplay = [...PATIENT_FIELDS, ...extraFields].filter(
    ({ key }) => !getSetting(`fields.${key}.hidden`),
  );

  const leftWidth = vdsSrc ? 66 : 88;
  const rightWidth = 100 - leftWidth;

  return (
    <Row>
      <Col style={{ width: `${leftWidth}%` }}>
        <Row>
          {detailsToDisplay.map(({ key, label: defaultLabel, accessor }) => {
            const value =
              accessor?.(patient, {  getTranslation, getSetting, formatShort }) ?? (patient[key] || '');
            const label =
              getTranslation(`general.localisedField.${key}.label.short`) ||
              getTranslation(`general.localisedField.${key}.label`) ||
              defaultLabel;

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
