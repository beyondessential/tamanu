import React from 'react';
import { PatientDetails as CambodiaPatientDetails } from './cambodia/PatientDetails';
// import { PatientDetails as GenericPatientDetails } from './generic/PatientDetails';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';

const PATIENT_DETAIL_LAYOUTS = {
  GENERIC: 'generic',
  CAMBODIA: 'cambodia',
};

export const PatientDetails = ({ patient, onEdit, navigation }) => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails');
  switch (layout) {
    case PATIENT_DETAIL_LAYOUTS.CAMBODIA:
      return <CambodiaPatientDetails patient={patient} onEdit={onEdit} navigation={navigation} />;
    default:
      // return <GenericPatientDetails patient={patient} onEdit={onEdit} navigation={navigation} />;
      break;
  }
};
