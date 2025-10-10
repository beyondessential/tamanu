import { createValueIndex } from '@tamanu/shared/utils/valueIndex';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { CrossIcon } from '../assets/icons/CrossIcon';
import { HospitalIcon } from '../assets/icons/HospitalIcon';
import { HousePlusIcon } from '../assets/icons/HousePlusIcon';
import { patientIcon, radiologyIcon, scheduleIcon, vaccineIcon } from './images';

export const ENCOUNTER_OPTIONS = [
  {
    value: ENCOUNTER_TYPES.ADMISSION,
    icon: HospitalIcon,
    color: '#47CA80',
    backgroundColor: '#EDFAF3',
    description: 'Inpatient care with overnight stay',
  },
  {
    value: ENCOUNTER_TYPES.TRIAGE,
    icon: HousePlusIcon,
    triageFlowOnly: true,
    color: '#FFCC24',
    backgroundColor: '#FFFAEA',
    description: 'Outpatient consultation and treatment',
  },
  {
    value: ENCOUNTER_TYPES.CLINIC,
    icon: CrossIcon,
    color: '#F17F16',
    backgroundColor: '#FEF3E8',
    description: 'Emergency assessment and care',
  },
  // Not part of this feature but needed to do this to properly style so may as well leave it here
  // {
  //   value: ENCOUNTER_TYPES.TELEHEALTH,
  //   icon: administrationIcon,
  //   color: '#4101C9',
  //   backgroundColor: '#D9CCF4',
  //   description: 'Remote phone or video consultation',
  // },
  {
    value: ENCOUNTER_TYPES.IMAGING,
    image: radiologyIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.EMERGENCY,
    image: scheduleIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.OBSERVATION,
    image: patientIcon,
    triageFlowOnly: true,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.SURVEY_RESPONSE,
    image: patientIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.VACCINATION,
    image: vaccineIcon,
    hideFromMenu: true,
  },
];

export const ENCOUNTER_OPTIONS_BY_VALUE = createValueIndex(ENCOUNTER_OPTIONS);
