import { PATIENT_DETAIL_LAYOUTS } from '@tamanu/constants';

import {
  GenericPatientFieldLayout,
  GenericPrimaryDetailsLayout,
  GenericSecondaryDetailsLayout,
} from './layouts/generic/GenericLayout';

// This file is leftover from a hardcoded patient details layout implementation.

const LAYOUT_COMPONENTS = {
  [PATIENT_DETAIL_LAYOUTS.GENERIC]: {
    PrimaryDetails: GenericPrimaryDetailsLayout,
    SecondaryDetails: GenericSecondaryDetailsLayout,
    PatientFields: GenericPatientFieldLayout,
  },
};

export const useLayoutComponents = () => {
  const layout = PATIENT_DETAIL_LAYOUTS.GENERIC;
  return LAYOUT_COMPONENTS[layout] ?? LAYOUT_COMPONENTS[PATIENT_DETAIL_LAYOUTS.GENERIC];
};
