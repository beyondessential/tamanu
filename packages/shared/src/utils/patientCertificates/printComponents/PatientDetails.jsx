import React from 'react';
import { DataSection } from './DataSection';
import { Col } from '../Layout';
import { getDOBWithAge, getSex, getVillageName } from '../../patientAccessors';
import { renderDataItems } from './renderDataItems';

const PATIENT_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDOBWithAge },
  ],
  rightCol: [
    { key: 'displayId', label: 'Patient ID' },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'villageName', label: 'Village', accessor: getVillageName },
  ],
};

export const PatientDetails = ({ patient, getSetting }) => {
  return (
    <DataSection title="Patient details">
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, getSetting)}</Col>
      <Col>{renderDataItems(PATIENT_FIELDS.rightCol, patient, getSetting)}</Col>
    </DataSection>
  );
};
