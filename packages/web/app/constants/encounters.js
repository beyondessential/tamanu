import { createValueIndex } from '@tamanu/shared/utils/valueIndex';
import { ENCOUNTER_LABELS, ENCOUNTER_TYPES } from '@tamanu/constants';
import {
  administrationIcon,
  medicationIcon,
  patientIcon,
  radiologyIcon,
  scheduleIcon,
  vaccineIcon,
} from './images';

export const ENCOUNTER_OPTIONS = [
  {
    value: ENCOUNTER_TYPES.ADMISSION,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.ADMISSION],
    image: medicationIcon,
  },
  {
    value: ENCOUNTER_TYPES.TRIAGE,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.TRIAGE],
    image: patientIcon,
    triageFlowOnly: true,
  },
  {
    value: ENCOUNTER_TYPES.CLINIC,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.CLINIC],
    image: administrationIcon,
  },
  {
    value: ENCOUNTER_TYPES.IMAGING,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.IMAGING],
    image: radiologyIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.EMERGENCY,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.EMERGENCY],
    image: scheduleIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.OBSERVATION,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.OBSERVATION],
    image: patientIcon,
    triageFlowOnly: true,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.SURVEY_RESPONSE,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.SURVEY_RESPONSE],
    image: patientIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.VACCINATION,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.VACCINATION],
    image: vaccineIcon,
    hideFromMenu: true,
  },
];

export const ENCOUNTER_OPTIONS_BY_VALUE = createValueIndex(ENCOUNTER_OPTIONS);
