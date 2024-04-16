import React from 'react';
import { PatientDetails as CambodiaPatientDetails } from './cambodia/PatientDetails';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';

const PATIENT_DETAIL_LAYOUTS = {
  GENERIC: 'generic',
  CAMBODIA: 'cambodia',
};

export const BASIC_PATIENT_FIELDS = {
  LAST_NAME: 'lastName',
  FIRST_NAME: 'firstName',
  DATE_OF_BIRTH: 'dateOfBirth',
  SEX: 'sex',
  CULTURAL_NAME: 'culturalName',
  VILLAGE_ID: 'villageId',
};

export const PAD_PATIENT_FIELDS = {
  DIVISION_ID: 'divisionId',
  SUBDIVISION_ID: 'subdivisionId',
  SETTLEMENT_ID: 'settlementId',
  STREET_VILLAGE: 'streetVillage',
  PRIMARY_CONTACT_NUMBER: 'primaryContactNumber',
  SECONDARY_CONTACT_NUMBER: 'secondaryContactNumber',
  EMERGENCY_CONTACT_NAME: 'emergencyContactName',
  EMERGENCY_CONTACT_NUMBER: 'emergencyContactNumber',
  MEDICAL_AREA_ID: 'medicalAreaId',
  NURSING_ZONE_ID: 'nursingZoneId',
  BIRTH_CERTIFICATE: 'birthCertificate',
  NATIONAL_ID: 'nationalId',
  PASSPORT: 'passport',
  ID_POOR_CARD_NUMBER: 'idPoorCardNumber',
  PMRS_NUMBER: 'pmrsNumber',
  COUNTRY_OF_BIRTH_ID: 'countryOfBirthId',
};

export const PatientDetails = ({ patient, onEdit, navigation }) => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails');
  if (layout === PATIENT_DETAIL_LAYOUTS.CAMBODIA) {
    return <CambodiaPatientDetails patient={patient} onEdit={onEdit} navigation={navigation} />;
  }
  return null;
};
