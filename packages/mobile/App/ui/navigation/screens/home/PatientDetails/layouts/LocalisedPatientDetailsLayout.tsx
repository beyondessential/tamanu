import React from 'react';
import { PatientDetails as CambodiaPatientDetails } from './cambodia/PatientDetails';
import { PatientDetails as GenericPatientDetails } from './generic/PatientDetails';
import { EditPatientScreen as GenericEditPatientScreen } from './generic/EditGeneralInfo';
import { EditPatientScreen as CambodiaEditPatientScreen } from './cambodia/EditGeneralInfo';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';

const CUSTOM_PATIENT_DETAIL_LAYOUTS = {
  CAMBODIA: 'cambodia',
};

export const LocalisedPatientDetailsLayout = ({ patient, navigation }) => {
  const { getLocalisation } = useLocalisation();
  const layout = 'cambodia';
  console.log('TESTING', layout);

  switch (layout) {
    case CUSTOM_PATIENT_DETAIL_LAYOUTS.CAMBODIA:
      return <CambodiaPatientDetails patient={patient} navigation={navigation} />;
    default:
      return <GenericPatientDetails patient={patient} navigation={navigation} />;
  }
};

export const LocalisedNewPatientForm = ({ route }) => {
  const { getLocalisation } = useLocalisation();
  const layout = 'cambodia';
  console.log('TESTING', layout);
  switch (layout) {
    case CUSTOM_PATIENT_DETAIL_LAYOUTS.CAMBODIA:
      return <CambodiaEditPatientScreen route={route} isEdit={false} />;
    default:
      return <GenericEditPatientScreen route={route} isEdit={false} />;
  }
};
