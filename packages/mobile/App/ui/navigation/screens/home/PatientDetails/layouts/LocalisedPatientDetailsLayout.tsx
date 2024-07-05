import React from 'react';
import { PatientDetails as CambodiaPatientDetails } from './cambodia/PatientDetails';
import { PatientDetails as GenericPatientDetails } from './generic/PatientDetails';
import { EditPatientScreen as GenericEditPatientScreen } from './generic/EditGeneralInfo';
import { EditPatientScreen as CambodiaEditPatientScreen } from './cambodia/EditGeneralInfo';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';

const CUSTOM_PATIENT_DETAIL_LAYOUTS = {
  CAMBODIA: 'cambodia',
};


// This is a temporary hard-coded implementation of the alternative cambodia patient details form. Ideally this would
// be more configurable/dynamically generated. For now now bug fixes/changes within GenericPatientDetails also
// need to be applied to CambodiaPatientDetails
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

export const LocalisedNewPatientForm = ({ route }) => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails');
  switch (layout) {
    case CUSTOM_PATIENT_DETAIL_LAYOUTS.CAMBODIA:
      return <CambodiaEditPatientScreen route={route} isEdit={false} />;
    default:
      return <GenericEditPatientScreen route={route} isEdit={false} />;
  }
};
