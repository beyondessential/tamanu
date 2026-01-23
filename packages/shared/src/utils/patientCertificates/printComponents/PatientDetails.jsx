import React from 'react';
import { DataSection } from './DataSection';
import { Col } from '../Layout';
import { getDobWithAge, getSex, getVillageName } from '../../patientAccessors';
import { useLanguageContext } from '../../pdf/languageContext';
import { renderDataItems } from './renderDataItems';
import { useDateTimeFormat } from '../../pdf/withDateTimeContext';

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

export const PatientDetails = ({ patient, getSetting }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTimeFormat();
  return (
    <DataSection title="Patient details">
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, { getTranslation, getSetting, formatShort })}</Col>
      <Col>
        {renderDataItems(PATIENT_FIELDS.rightCol, patient, { getTranslation, getSetting, formatShort })}
      </Col>
    </DataSection>
  );
};
