import React from 'react';
import { useLanguageContext } from '../pdf/languageContext';
import { useDateTimeFormat } from '../pdf/withDateTimeContext';
import { Divider } from './Divider';
import { Col, Row } from '../patientCertificates/Layout';
import { P } from '../patientCertificates/Typography';
import { getDob, getName, getSex } from '../patientAccessors';

const PATIENT_FIELDS = [
  { key: 'name', label: 'Patient Name', accessor: getName, percentageWidth: 40 },
  { key: 'displayId', label: 'Patient ID', percentageWidth: 40 },
  {
    key: 'dateOfBirth',
    label: 'DOB',
    accessor: getDob,
    percentageWidth: 20,
  },
  { key: 'sex', label: 'Sex', accessor: getSex, percentageWidth: 40 },
];

const ValueDisplay = ({ width, title, value }) => (
  <Col style={{ width }}>
    <P mb={5} style={{ fontSize: 10 }}>
      <P style={{ fontSize: 10 }} bold>
        {title}:
      </P>{' '}
      {value}
    </P>
  </Col>
);

export const HandoverPatient = ({
  patient,
  location,
  arrivalDate,
  diagnosis,
  notes,
  getSetting,
  createdAt,
  isEdited,
}) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort, formatShortest, formatShortDateTime } = useDateTimeFormat();
  const detailsToDisplay = PATIENT_FIELDS.filter(({ key }) => !getSetting(`fields.${key}.hidden`));
  return (
    <>
      <Row style={{ width: '100%', marginBottom: 40 }}>
        <Col style={{ width: '100%' }}>
          <Row>
            {detailsToDisplay.map(
              ({ key, label: defaultLabel, accessor, percentageWidth = 33 }) => {
                const value =
                  (accessor
                    ? accessor(patient, { getTranslation, formatShort })
                    : patient[key]) || '';
                const label =
                  defaultLabel ||
                  getTranslation(`general.localisedField.${key}.label.short`) ||
                  getTranslation(`general.localisedField.${key}.label`);

                return (
                  <ValueDisplay
                    key={key}
                    width={`${percentageWidth}%`}
                    title={label}
                    value={value}
                  />
                );
              },
            )}
            <ValueDisplay width="40%" title="Location" value={location} />
            <ValueDisplay
              width="20%"
              title="Arrival date"
              value={formatShortest(arrivalDate)}
            />
          </Row>
          {diagnosis && <ValueDisplay width="100%" title="Diagnosis" value={diagnosis} />}
          <Row>
            <ValueDisplay width="100%" title="Notes" value={notes || 'N/A'} />
            {!!notes && !!createdAt && (
              <Col style={{ width: '100%' }}>
                <P style={{ fontSize: 8 }}>
                  {`${formatShortDateTime(createdAt)}${isEdited ? ' (edited)' : ''}`}
                </P>
              </Col>
            )}
          </Row>
        </Col>
      </Row>
      <Divider />
    </>
  );
};
