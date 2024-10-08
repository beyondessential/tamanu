import React from 'react';
import { PatientDetails as GenericPatientDetails } from './generic/PatientDetails';
import { EditPatientScreen as GenericEditPatientScreen } from './generic/EditGeneralInfo';

// This is a temporary hard-coded implementation for brand-specific patient details form. Ideally this would
// be more configurable/dynamically generated. For now now bug fixes/changes within GenericPatientDetails also
// need to be applied to brand-specific PatientDetails
export const LocalisedPatientDetailsLayout = ({ patient, navigation }) => {
  return <GenericPatientDetails patient={patient} navigation={navigation} />;
};

export const LocalisedNewPatientForm = ({ route }) => {
  return <GenericEditPatientScreen route={route} isEdit={false} />;
};
