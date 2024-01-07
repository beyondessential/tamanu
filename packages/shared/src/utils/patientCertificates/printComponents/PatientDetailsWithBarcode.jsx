import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { getDOB, getSex } from '../../patientAccessors';
import { PrintableBarcode } from './PrintableBarcode';
import { renderDataItems } from './renderDataItems';

const PATIENT_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDOB },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'villageId', label: 'Village' },
  ],
  rightCol: [{ key: 'displayId', label: 'Patient ID' }],
};

export const PatientDetailsWithBarcode = ({ patient, getLocalisation }) => {
  return (
    <DataSection title="Patient details">
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, getLocalisation)}</Col>
      <Col>
        {renderDataItems(PATIENT_FIELDS.rightCol, patient, getLocalisation)}
        <PrintableBarcode patient={patient} width="128px" height="22px" margin="2mm" />
      </Col>
    </DataSection>
  );
};
