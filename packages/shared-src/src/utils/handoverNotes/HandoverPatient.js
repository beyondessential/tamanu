import React from 'react';
import { getDisplayDate } from 'shared/utils/patientCertificates/getDisplayDate';
import { Divider } from 'shared/utils/handoverNotes/Divider';
import { Col, Row } from '../patientCertificates/Layout';
import { P } from '../patientCertificates/Typography';
import { getDOB } from '../patientCertificates/accessors';
import { getName, getSex } from './accessors';

const PATIENT_FIELDS = [
  { key: 'name', label: 'Patient Name', accessor: getName },
  { key: 'displayId', label: 'Patient ID' },
  {
    key: 'dateOfBirth',
    label: 'DOB',
    accessor: getDOB,
  },
  { key: 'sex', label: 'Sex', accessor: getSex },
];

export const HandoverPatient = ({
  patient,
  location,
  arrivalDate,
  diagnosis,
  notes,
  getLocalisation,
  createdAt,
}) => {
  const detailsToDisplay = [
    ...PATIENT_FIELDS.filter(({ key }) => getLocalisation(`fields.${key}.hidden`) !== true),
  ];
  return (
    <>
      <Row style={{ width: '100%', marginBottom: 40 }}>
        <Col style={{ width: '100%' }}>
          <Row>
            {detailsToDisplay.map(({ key, label: defaultLabel, accessor }) => {
              const value = (accessor ? accessor(patient, getLocalisation) : patient[key]) || '';
              const label = defaultLabel || getLocalisation(`fields.${key}.shortLabel`);

              return (
                <Col key={key} style={{ width: '33%' }}>
                  <P mb={5} style={{ fontSize: 10 }}>
                    <P style={{ fontSize: 10 }} bold>
                      {label}:
                    </P>{' '}
                    {value}
                  </P>
                </Col>
              );
            })}
            <Col style={{ width: '33%' }}>
              <P mb={5} style={{ fontSize: 10 }}>
                <P style={{ fontSize: 10 }} bold>
                  Location:
                </P>{' '}
                {location}
              </P>
            </Col>
            <Col style={{ width: '33%' }}>
              <P mb={5} style={{ fontSize: 10 }}>
                <P style={{ fontSize: 10 }} bold>
                  Arrival date:
                </P>{' '}
                {getDisplayDate(arrivalDate)}
              </P>
            </Col>
          </Row>
          {diagnosis && (
            <Row>
              <Col style={{ width: '100%' }}>
                <P mb={5} style={{ fontSize: 10 }}>
                  <P style={{ fontSize: 10 }} bold>
                    Diagnosis:
                  </P>{' '}
                  {diagnosis}
                </P>
              </Col>
            </Row>
          )}
          {notes && (
            <Row>
              <Col style={{ width: '100%' }}>
                <P mb={5} style={{ fontSize: 10 }}>
                  <P style={{ fontSize: 10 }} bold>
                    Notes:
                  </P>{' '}
                  {notes}
                </P>
              </Col>
              {createdAt && (
                <Col style={{ width: '100%' }}>
                  <P style={{ fontSize: 8 }}>{getDisplayDate(createdAt, 'dd/MM/yyyy hh:mm a')}</P>
                </Col>
              )}
            </Row>
          )}
        </Col>
      </Row>
      <Divider />
    </>
  );
};
