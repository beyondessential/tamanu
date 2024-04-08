import React from 'react';
import { DataSection } from './DataSection';
import { Col } from '../Layout';
import { getAddress, getDOBWithAge, getSex, getVillageName } from '../../patientAccessors';
import { renderDataItems } from './renderDataItems';

const PATIENT_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDOBWithAge },
    { key: 'address', label: 'Address', accessor: getAddress },
  ],
  rightCol: [
    { key: 'displayId', label: 'Patient ID' },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'villageName', label: 'Village', accessor: getVillageName },
  ],
};

export const PatientDetailsWithAddress = ({ patient, getLocalisation }) => {
  return (
    <DataSection title="Patient details">
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, getLocalisation)}</Col>
      <Col>{renderDataItems(PATIENT_FIELDS.rightCol, patient, getLocalisation)}</Col>
    </DataSection>
  );
};
