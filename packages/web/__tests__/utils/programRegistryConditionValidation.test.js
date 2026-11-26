import { describe, expect, it } from 'vitest';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { getValidationSchema } from '@tamanu/ui-components';
import {
  isProgramRegistryConditionAnswerable,
  isProgramRegistryConditionRequired,
} from '@tamanu/utils/programRegistryConditions';

const conditionQuestion = (dataElementId, visibilityCriteria) => ({
  id: `component-${dataElementId}`,
  dataElementId,
  dataElement: {
    id: dataElementId,
    type: PROGRAM_DATA_ELEMENT_TYPES.PROGRAM_REGISTRY_CONDITION,
    code: dataElementId,
  },
  visibilityCriteria: visibilityCriteria && JSON.stringify(visibilityCriteria),
});

const selectQuestion = dataElementId => ({
  id: `component-${dataElementId}`,
  dataElementId,
  dataElement: { id: dataElementId, type: PROGRAM_DATA_ELEMENT_TYPES.SELECT, code: dataElementId },
});

const registrationWriteBack = {
  id: 'component-status',
  dataElementId: 'status',
  dataElement: { id: 'status', type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA, code: 'status' },
  config: JSON.stringify({ writeToPatient: { fieldName: 'registrationClinicalStatus' } }),
};

const answer = (conditionId, categoryId) => JSON.stringify({ conditionId, categoryId });

const validate = (components, values, isConditionRequired) =>
  getValidationSchema({ components }, (_, fallback) => fallback, {}, { isConditionRequired })
    .validate(values, { abortEarly: false })
    .then(() => [])
    .catch(error => error.inner.map(({ path }) => path));

const registryOptions = overrides => ({
  programRegistry: { id: 'registry', mandatoryConditionEnabled: true },
  conditions: [{ id: 'asthma', name: 'Asthma' }],
  registrationStatus: 'active',
  recordedConditionIds: [],
  ...overrides,
});

describe('program registry condition validation', () => {
  it('requires a category once a condition is chosen', async () => {
    const components = [conditionQuestion('q1')];

    expect(await validate(components, { q1: answer('asthma', null) }, false)).toEqual(['q1']);
    expect(await validate(components, { q1: answer('asthma', 'confirmed') }, false)).toEqual([]);
    expect(await validate(components, {}, false)).toEqual([]);
  });

  it('requires a condition across the form, reported on the first visible question', async () => {
    const components = [
      selectQuestion('showFirst'),
      conditionQuestion('q1', { showFirst: 'yes' }),
      conditionQuestion('q2'),
    ];

    expect(await validate(components, { showFirst: 'yes' }, true)).toEqual(['q1']);
    expect(await validate(components, { showFirst: 'no' }, true)).toEqual(['q2']);
    expect(
      await validate(components, { showFirst: 'yes', q2: answer('asthma', 'confirmed') }, true),
    ).toEqual([]);
    expect(await validate(components, { showFirst: 'yes' }, false)).toEqual([]);
  });

  it('is answerable when the patient is registered or the form registers them', () => {
    const components = [conditionQuestion('q1')];

    expect(isProgramRegistryConditionAnswerable(registryOptions(), components)).toBe(true);
    expect(
      isProgramRegistryConditionAnswerable(
        registryOptions({ registrationStatus: null }),
        components,
      ),
    ).toBe(false);
    expect(
      isProgramRegistryConditionAnswerable(registryOptions({ registrationStatus: null }), [
        ...components,
        registrationWriteBack,
      ]),
    ).toBe(true);
    expect(isProgramRegistryConditionAnswerable({ programRegistry: null }, components)).toBe(false);
  });

  it('is required only when the registry asks and the patient has no current condition', () => {
    const components = [conditionQuestion('q1')];

    expect(isProgramRegistryConditionRequired(registryOptions(), components)).toBe(true);
    expect(
      isProgramRegistryConditionRequired(
        registryOptions({ recordedConditionIds: ['asthma'] }),
        components,
      ),
    ).toBe(false);
    expect(
      isProgramRegistryConditionRequired(
        registryOptions({ programRegistry: { id: 'registry', mandatoryConditionEnabled: false } }),
        components,
      ),
    ).toBe(false);
    expect(
      isProgramRegistryConditionRequired(registryOptions({ conditions: [] }), components),
    ).toBe(false);
  });
});
