import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { getDOB, getSex } from '../../patientAccessors';
import { PatientBarcode } from './PatientBarcode';

const PATIENT_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'dateOfBirth', label: 'Date Of Birth', accessor: getDOB },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'villageId', label: 'Village' },
  ],
  rightCol: [
    { key: 'displayId', label: 'Patient ID' },
  ],
};

export const PatientDetailsWithBarcode = ({ patient, getLocalisation }) => {
  return (
    <DataSection title="Patient details">
      <Col>
        {PATIENT_FIELDS.leftCol.map(({ key, label: defaultLabel, accessor }) => {
          const value = (accessor ? accessor(patient, getLocalisation) : patient[key]) || '';
          const label = getLocalisation(`fields.${key}.shortLabel`) || defaultLabel;
          return <DataItem label={label} value={value} />;
        })}
      </Col>
      <Col>
        {PATIENT_FIELDS.rightCol.map(({ key, label: defaultLabel, accessor }) => {
          const value = (accessor ? accessor(patient, getLocalisation) : patient[key]) || '';
          const label = getLocalisation(`fields.${key}.shortLabel`) || defaultLabel;
          return <DataItem label={label} value={value} />;
        })}
          <PatientBarcode patient={patient} width="128px" height="22px" margin="2mm" />
      </Col>
    </DataSection>
  );
};
