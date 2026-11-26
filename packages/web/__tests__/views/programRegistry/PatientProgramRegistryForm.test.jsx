import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../../helpers';

const { nextValues, registries } = vi.hoisted(() => ({
  nextValues: {},
  registries: {
    'registry-village': { id: 'registry-village', currentlyAtType: 'village' },
    'registry-facility': { id: 'registry-facility', currentlyAtType: 'facility' },
  },
}));

vi.mock('../../../app/components/Field', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    AutocompleteField: ({ field, onChange, disabled, suggester }) => (
      <button
        type="button"
        aria-label={field.name}
        data-endpoint={suggester?.endpoint}
        data-value={field.value ?? ''}
        disabled={disabled}
        onClick={() => onChange({ target: { name: field.name, value: nextValues[field.name] } })}
      >
        select
      </button>
    ),
    DateField: () => null,
    ArrayField: () => null,
  };
});

vi.mock('../../../app/features/ProgramRegistry', () => ({
  ProgramRegistryConditionField: () => null,
  ProgramRegistryConditionCategoryField: () => null,
}));

vi.mock('../../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useSuggester: endpoint => ({ endpoint }),
}));

vi.mock('../../../app/api/queries', async importOriginal => ({
  ...(await importOriginal()),
  useProgramRegistryQuery: id => ({ data: registries[id], isInitialLoading: false }),
}));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' }, facilityId: 'facility-registering' }),
}));

vi.mock('../../../app/contexts/Patient', () => ({
  usePatient: () => ({ patient: { id: 'patient-1' } }),
}));

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({ getCurrentDate: () => '2026-11-12' }),
}));

const { PatientProgramRegistryForm } =
  await import('../../../app/views/programRegistry/PatientProgramRegistryForm');

const renderForm = onSubmit =>
  renderElementWithTranslatedText(
    <PatientProgramRegistryForm onSubmit={onSubmit} onCancel={() => {}} />,
  );

const choose = (fieldName, value) => {
  nextValues[fieldName] = value;
  fireEvent.click(screen.getByRole('button', { name: fieldName }));
};

const confirm = () => fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

describe('PatientProgramRegistryForm currently in', () => {
  beforeEach(() => {
    for (const key of Object.keys(nextValues)) delete nextValues[key];
  });

  it('is disabled until a program registry is chosen', () => {
    renderForm(vi.fn());

    expect(screen.getByRole('button', { name: 'facilityId' }).disabled).toBe(true);

    choose('programRegistryId', 'registry-facility');

    expect(screen.getByRole('button', { name: 'facilityId' }).disabled).toBe(false);
  });

  it("suggests villages or facilities by the registry's currently at type", async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    choose('programRegistryId', 'registry-village');
    const villageField = screen.getByRole('button', { name: 'villageId' });
    expect(villageField.getAttribute('data-endpoint')).toBe('village');

    choose('villageId', 'village-1');
    confirm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      programRegistryId: 'registry-village',
      villageId: 'village-1',
    });
  });

  it('clears the chosen place when a different registry is chosen', async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    choose('programRegistryId', 'registry-village');
    choose('villageId', 'village-1');
    choose('programRegistryId', 'registry-facility');

    const facilityField = screen.getByRole('button', { name: 'facilityId' });
    expect(facilityField.getAttribute('data-endpoint')).toBe('facility');
    expect(facilityField.getAttribute('data-value')).toBe('');

    confirm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      programRegistryId: 'registry-facility',
      villageId: null,
      facilityId: null,
    });
  });
});
