import React from 'react';
import { DataSection } from './DataSection';
import { Col } from '../Layout';
import { getAddress, getDobWithAge, getSex, getVillageName } from '../../patientAccessors';
import { useLanguageContext } from '../../pdf/languageContext';
import { renderDataItems } from './renderDataItems';

const PATIENT_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDobWithAge },
    { key: 'address', label: 'Address', accessor: getAddress },
  ],
  rightCol: [
    { key: 'displayId', label: 'Patient ID' },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'villageId', label: 'Village', accessor: getVillageName },
  ],
};

export const PatientDetailsWithAddress = ({ patient, getLocalisation }) => {
  const { getTranslation } = useLanguageContext();
  return (
    <DataSection title={getTranslation('pdf.patientDetails.title', 'Patient details')}>
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, getLocalisation, getTranslation)}</Col>
      <Col>
        {renderDataItems(PATIENT_FIELDS.rightCol, patient, getLocalisation, getTranslation)}
      </Col>
    </DataSection>
  );
};
