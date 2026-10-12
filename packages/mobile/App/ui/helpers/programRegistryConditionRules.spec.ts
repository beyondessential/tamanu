import { FieldTypes } from './fields';
import {
  getProgramRegistryConditionErrors,
  isProgramRegistryConditionAnswerable,
  isProgramRegistryConditionRequired,
  type ProgramRegistryConditionOptions,
} from './programRegistryConditionRules';

const question = (code: string, type: string, extra: Record<string, any> = {}): any => ({
  id: `component-${code}`,
  dataElement: { id: code, code, type },
  ...extra,
});

const conditionQuestion = (code: string, visibilityCriteria?: object) =>
  question(code, FieldTypes.PROGRAM_REGISTRY_CONDITION, {
    visibilityCriteria: visibilityCriteria && JSON.stringify(visibilityCriteria),
  });

const answer = (conditionId: string, categoryId: string | null) =>
  JSON.stringify({ conditionId, categoryId });

const options = (overrides: Partial<ProgramRegistryConditionOptions> = {}) => ({
  programRegistry: { id: 'registry', name: 'Registry', mandatoryConditionEnabled: true },
  conditions: [{ id: 'asthma', name: 'Asthma' }],
  conditionCategories: [{ id: 'confirmed', name: 'Confirmed' }],
  isPatientRegistered: true,
  recordedConditionIds: [],
  ...overrides,
});

describe('program registry condition rules', () => {
  it('requires a category once a condition is chosen', () => {
    const components = [conditionQuestion('q1')];

    expect(
      getProgramRegistryConditionErrors(components, { q1: answer('asthma', null) }, false, 'Req'),
    ).toEqual({ q1: 'Req' });
    expect(
      getProgramRegistryConditionErrors(
        components,
        { q1: answer('asthma', 'confirmed') },
        false,
        'Req',
      ),
    ).toEqual({});
  });

  it('requires a condition across the form, reported on the first visible question', () => {
    const components = [
      question('showFirst', FieldTypes.SELECT),
      conditionQuestion('q1', { showFirst: 'yes' }),
      conditionQuestion('q2'),
    ];

    expect(
      getProgramRegistryConditionErrors(components, { showFirst: 'yes' }, true, 'Req'),
    ).toEqual({ q1: 'Req' });
    expect(getProgramRegistryConditionErrors(components, { showFirst: 'no' }, true, 'Req')).toEqual(
      {
        q2: 'Req',
      },
    );
    expect(
      getProgramRegistryConditionErrors(
        components,
        { showFirst: 'yes', q2: answer('asthma', 'confirmed') },
        true,
        'Req',
      ),
    ).toEqual({});
  });

  it('is answerable when the patient is registered or the form registers them', () => {
    const components = [conditionQuestion('q1')];
    const writeBack = question('status', FieldTypes.PATIENT_DATA, {
      config: JSON.stringify({ writeToPatient: { fieldName: 'registrationClinicalStatus' } }),
    });

    expect(isProgramRegistryConditionAnswerable(options(), components)).toBe(true);
    expect(
      isProgramRegistryConditionAnswerable(options({ isPatientRegistered: false }), components),
    ).toBe(false);
    expect(
      isProgramRegistryConditionAnswerable(options({ isPatientRegistered: false }), [
        ...components,
        writeBack,
      ]),
    ).toBe(true);
  });

  it('is required only when the registry asks and the patient has no current condition', () => {
    const components = [conditionQuestion('q1')];

    expect(isProgramRegistryConditionRequired(options(), components)).toBe(true);
    expect(
      isProgramRegistryConditionRequired(options({ recordedConditionIds: ['asthma'] }), components),
    ).toBe(false);
    expect(isProgramRegistryConditionRequired(options({ conditions: [] }), components)).toBe(false);
  });
});
