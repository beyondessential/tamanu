import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { getAddress, getDOB, getSex } from '../../patientAccessors';

const PATIENT_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'dateOfBirth', label: 'Date Of Birth', accessor: getDOB },
    { key: 'address', label: 'Address', accessor: getAddress },
  ],
  rightCol: [
    { key: 'displayId', label: 'Patient ID' },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'villageId', label: 'Village' },
  ],
};

export const PatientDetailsWithAddress = ({ patient, getLocalisation }) => {
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
      </Col>
    </DataSection>
  );
};
