const PATIENT_DETAIL_LAYOUTS = {
  GENERIC: 'generic',
  CAMBODIA: 'cambodia',
};

import { CambodiaGeneralInfo } from './cambodia/CambodiaGeneralInfo';
import { CambodiaAdditionalInfo } from './cambodia/CambodiaAdditionalInfo';

import { GeneralInfo } from './generic/GeneralInfo';
import { AdditionalInfo } from './generic/AdditionalInfo';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';



const LAYOUT_COMPONENTS = {
  [PATIENT_DETAIL_LAYOUTS.GENERIC]: {
    GeneralInfo: GeneralInfo,
    AdditionalInfo: AdditionalInfo,
  },
  [PATIENT_DETAIL_LAYOUTS.CAMBODIA]: {
    GeneralInfo: CambodiaGeneralInfo,
    AdditionalInfo: CambodiaAdditionalInfo,
  },
};

export const useLayoutComponents = () => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails') || PATIENT_DETAIL_LAYOUTS.GENERIC;
  console.log('layout', layout)
  return LAYOUT_COMPONENTS[layout];
};
