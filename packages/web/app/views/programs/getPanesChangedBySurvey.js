import { PROGRAM_DATA_ELEMENT_TYPES, PROGRAM_REGISTRY_FIELD_LOCATIONS } from '@tamanu/constants';
import { getConfigObject } from '@tamanu/ui-components';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';

const writesProgramRegistration = ({ id, dataElement, config }) =>
  dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA &&
  PROGRAM_REGISTRY_FIELD_LOCATIONS.includes(getConfigObject(id, config).writeToPatient?.fieldName);

export const getPanesChangedBySurvey = components => {
  const panes = [];
  if (
    components.some(
      component =>
        component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PROGRAM_REGISTRY_CONDITION ||
        writesProgramRegistration(component),
    )
  ) {
    panes.push(PANE_SECTION_IDS.PROGRAM_REGISTRY);
  }
  if (
    components.some(
      component => component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE,
    )
  ) {
    panes.push(PANE_SECTION_IDS.ISSUES);
  }
  return panes;
};
