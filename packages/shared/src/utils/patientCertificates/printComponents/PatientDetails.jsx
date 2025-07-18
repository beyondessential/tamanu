import React from 'react';
import { DataSection } from './DataSection';
import { Col } from '../Layout';
import { getDobWithAge, getSex, getVillageName } from '../../patientAccessors';
import { useLanguageContext } from '../../pdf/languageContext';
import { renderDataItems } from './renderDataItems';

const PATIENT_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDobWithAge },
  ],
  rightCol: [
    { key: 'displayId', label: 'Patient ID' },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'villageName', label: 'Village', accessor: getVillageName },
  ],
};

export const PatientDetails = ({ patient, getLocalisation, getSetting }) => {
  const { getTranslation } = useLanguageContext();
  return (
    <DataSection title="Patient details">
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, getLocalisation, getTranslation, getSetting)}</Col>
      <Col>
        {renderDataItems(PATIENT_FIELDS.rightCol, patient, getLocalisation, getTranslation, getSetting)}
      </Col>
    </DataSection>
  );
};
