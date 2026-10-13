import { describe, expect, it } from 'vitest';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { getPanesChangedBySurvey } from '../../../app/views/programs/getPanesChangedBySurvey';
import { PANE_SECTION_IDS } from '../../../app/components/PatientInfoPane/paneSections';

const question = (type, config) => ({
  id: `component-${type}`,
  dataElement: { type },
  config: config && JSON.stringify(config),
});

describe('getPanesChangedBySurvey', () => {
  it('changes no panes for a form without side effects', () => {
    expect(getPanesChangedBySurvey([question(PROGRAM_DATA_ELEMENT_TYPES.TEXT)])).toEqual([]);
  });

  it('changes the program registry pane for condition and registration write-back questions', () => {
    expect(
      getPanesChangedBySurvey([question(PROGRAM_DATA_ELEMENT_TYPES.PROGRAM_REGISTRY_CONDITION)]),
    ).toEqual([PANE_SECTION_IDS.PROGRAM_REGISTRY]);
    expect(
      getPanesChangedBySurvey([
        question(PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA, {
          writeToPatient: { fieldName: 'registrationClinicalStatus' },
        }),
      ]),
    ).toEqual([PANE_SECTION_IDS.PROGRAM_REGISTRY]);
    expect(
      getPanesChangedBySurvey([
        question(PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA, {
          writeToPatient: { fieldName: 'email' },
        }),
      ]),
    ).toEqual([]);
  });

  it('changes the issues pane for patient issue questions', () => {
    expect(getPanesChangedBySurvey([question(PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE)])).toEqual([
      PANE_SECTION_IDS.ISSUES,
    ]);
  });
});
