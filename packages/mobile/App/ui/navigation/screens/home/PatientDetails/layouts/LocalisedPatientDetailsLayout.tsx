import React from 'react';
import { PatientDetails as CambodiaPatientDetails } from './cambodia/PatientDetails';
import { PatientDetails as GenericPatientDetails } from './generic/PatientDetails';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';

const CUSTOM_PATIENT_DETAIL_LAYOUTS = {
  CAMBODIA: 'cambodia',
};

export const LocalisedPatientDetailsLayout = ({ patient, navigation }) => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails');
  switch (layout) {
    case CUSTOM_PATIENT_DETAIL_LAYOUTS.CAMBODIA:
      return <CambodiaPatientDetails patient={patient} navigation={navigation} />;
    default:
      return <GenericPatientDetails patient={patient} navigation={navigation} />;
  }
};
