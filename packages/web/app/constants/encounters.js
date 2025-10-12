import { createValueIndex } from '@tamanu/shared/utils/valueIndex';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { CrossIcon } from '../assets/icons/CrossIcon';
import { HospitalIcon } from '../assets/icons/HospitalIcon';
import { HousePlusIcon } from '../assets/icons/HousePlusIcon';
import { TAMANU_COLORS } from '@tamanu/ui-components';

export const ENCOUNTER_OPTIONS = [
  {
    value: ENCOUNTER_TYPES.ADMISSION,
    icon: HospitalIcon,
    color: TAMANU_COLORS.safe,
    backgroundColor: '#EDFAF3',
  },
  {
    value: ENCOUNTER_TYPES.CLINIC,
    icon: CrossIcon,
    color: TAMANU_COLORS.secondary,
    backgroundColor: '#FFFAEA',
  },
  {
    value: ENCOUNTER_TYPES.TRIAGE,
    icon: HousePlusIcon,
    triageFlowOnly: true,
    color: TAMANU_COLORS.orange,
    backgroundColor: '#FEF3E8',
  },
  {
    value: ENCOUNTER_TYPES.IMAGING,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.EMERGENCY,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.OBSERVATION,
    triageFlowOnly: true,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.SURVEY_RESPONSE,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.VACCINATION,
    hideFromMenu: true,
  },
];

export const ENCOUNTER_OPTIONS_BY_VALUE = createValueIndex(ENCOUNTER_OPTIONS);
