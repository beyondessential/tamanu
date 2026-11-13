import { describe, expect, it } from 'vitest';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { checkJSONCriteria } from '../src/criteria';
import {
  getInvalidConditionQuestionCodes,
  isProgramRegistryConditionAnswerable,
  isProgramRegistryConditionRequired,
  parseProgramRegistryConditionAnswer,
  type ProgramRegistryConditionOptions,
} from '../src/programRegistryConditions';

const question = (code: string, type: string, extra: Record<string, any> = {}) => ({
  dataElement: { code, type },
  ...extra,
});

const conditionQuestion = (code: string, extra: Record<string, any> = {}) =>
  question(code, PROGRAM_DATA_ELEMENT_TYPES.PROGRAM_REGISTRY_CONDITION, extra);

const answer = (conditionId: string, categoryId: string | null) =>
  JSON.stringify({ conditionId, categoryId });

const options = (
  overrides: Partial<ProgramRegistryConditionOptions> = {},
): ProgramRegistryConditionOptions => ({
  programRegistry: { id: 'registry', name: 'Registry', mandatoryConditionEnabled: true },
  conditions: [{ id: 'asthma', name: 'Asthma' }],
  conditionCategories: [{ id: 'confirmed', name: 'Confirmed' }],
  registrationStatus: 'active',
  recordedConditionIds: [],
  ...overrides,
});

const invalidCodes = (components: any[], values: Record<string, any>, isRequired: boolean) =>
  getInvalidConditionQuestionCodes(
    components,
    values,
    component => checkJSONCriteria(component.visibilityCriteria, components, values),
    isRequired,
  );

describe('program registry condition rules', () => {
  it('treats an unparsable answer as unanswered', () => {
    expect(parseProgramRegistryConditionAnswer('asthma')).toBeNull();
    expect(invalidCodes([conditionQuestion('q1')], { q1: 'asthma' }, true)).toEqual(['q1']);
  });

  it('requires a category once a condition is chosen', () => {
    const components = [conditionQuestion('q1')];

    expect(invalidCodes(components, { q1: answer('asthma', null) }, false)).toEqual(['q1']);
    expect(invalidCodes(components, { q1: answer('asthma', 'confirmed') }, false)).toEqual([]);
    expect(invalidCodes(components, {}, false)).toEqual([]);
  });

  it('requires a condition across the form, reported on the first visible question', () => {
    const components = [
      question('showFirst', PROGRAM_DATA_ELEMENT_TYPES.SELECT),
      conditionQuestion('q1', { visibilityCriteria: JSON.stringify({ showFirst: 'yes' }) }),
      conditionQuestion('q2'),
    ];

    expect(invalidCodes(components, { showFirst: 'yes' }, true)).toEqual(['q1']);
    expect(invalidCodes(components, { showFirst: 'no' }, true)).toEqual(['q2']);
    expect(
      invalidCodes(components, { showFirst: 'yes', q2: answer('asthma', 'confirmed') }, true),
    ).toEqual([]);
    expect(invalidCodes(components, { showFirst: 'yes' }, false)).toEqual([]);
  });

  it('needs the form to set the status of an inactive registration', () => {
    const writeBack = (fieldName: string) =>
      question(fieldName, PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA, {
        config: JSON.stringify({ writeToPatient: { fieldName } }),
      });
    const inactive = options({ registrationStatus: 'inactive' });

    expect(isProgramRegistryConditionAnswerable(inactive, [conditionQuestion('q1')])).toBe(false);
    expect(
      isProgramRegistryConditionAnswerable(inactive, [
        conditionQuestion('q1'),
        writeBack('registrationClinicalStatus'),
      ]),
    ).toBe(false);
    expect(
      isProgramRegistryConditionAnswerable(inactive, [
        conditionQuestion('q1'),
        writeBack('programRegistrationStatus'),
      ]),
    ).toBe(true);
  });

  it('is answerable when the patient is registered or the form registers them', () => {
    const components = [conditionQuestion('q1')];
    const writeBack = question('status', PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA, {
      config: JSON.stringify({ writeToPatient: { fieldName: 'registrationClinicalStatus' } }),
    });

    expect(isProgramRegistryConditionAnswerable(options(), components)).toBe(true);
    expect(
      isProgramRegistryConditionAnswerable(options({ registrationStatus: null }), components),
    ).toBe(false);
    expect(
      isProgramRegistryConditionAnswerable(options({ registrationStatus: null }), [
        ...components,
        writeBack,
      ]),
    ).toBe(true);
    expect(
      isProgramRegistryConditionAnswerable(options({ programRegistry: null }), components),
    ).toBe(false);
  });

  it('is required only when the registry asks and the patient has no current condition', () => {
    const components = [conditionQuestion('q1')];

    expect(isProgramRegistryConditionRequired(options(), components)).toBe(true);
    expect(
      isProgramRegistryConditionRequired(options({ recordedConditionIds: ['asthma'] }), components),
    ).toBe(false);
    expect(
      isProgramRegistryConditionRequired(
        options({
          programRegistry: { id: 'registry', name: 'Registry', mandatoryConditionEnabled: false },
        }),
        components,
      ),
    ).toBe(false);
    expect(isProgramRegistryConditionRequired(options({ conditions: [] }), components)).toBe(false);
  });
});
