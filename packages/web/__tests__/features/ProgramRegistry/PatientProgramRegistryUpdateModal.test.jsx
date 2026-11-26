import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../../helpers';

const { nextValues, submit } = vi.hoisted(() => ({ nextValues: {}, submit: { mock: null } }));

vi.mock('../../../app/components/Field', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    AutocompleteField: ({ field, onChange, suggester }) => (
      <button
        type="button"
        aria-label={field.name}
        data-endpoint={suggester?.endpoint}
        data-value={field.value ?? ''}
        onClick={() => onChange({ target: { name: field.name, value: nextValues[field.name] } })}
      >
        select
      </button>
    ),
  };
});

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  DateField: () => null,
}));

vi.mock('../../../app/features/ProgramRegistry/ProgramRegistryConditionField', () => ({
  ProgramRegistryConditionField: () => null,
}));

vi.mock('../../../app/features/ProgramRegistry/ProgramRegistryConditionCategoryField', () => ({
  ProgramRegistryConditionCategoryField: () => null,
}));

vi.mock('../../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useSuggester: endpoint => ({ endpoint }),
}));

vi.mock('../../../app/api/queries', async importOriginal => ({
  ...(await importOriginal()),
  usePatientProgramRegistryConditionsQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../../app/api/mutations', () => ({
  useUpdateProgramRegistryMutation: () => ({ mutateAsync: submit.mock, isLoading: false }),
}));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' } }),
}));

const { PatientProgramRegistryUpdateModal } =
  await import('../../../app/features/ProgramRegistry/PatientProgramRegistryUpdateModal');

const registration = overrides => ({
  id: 'registration-1',
  patientId: 'patient-1',
  programRegistryId: 'registry-1',
  date: '2026-11-01 09:00:00',
  villageId: null,
  facilityId: null,
  ...overrides,
});

const renderModal = patientProgramRegistration =>
  renderElementWithTranslatedText(
    <PatientProgramRegistryUpdateModal
      patientProgramRegistration={patientProgramRegistration}
      onClose={() => {}}
      open
    />,
  );

describe('PatientProgramRegistryUpdateModal currently in', () => {
  beforeEach(() => {
    for (const key of Object.keys(nextValues)) delete nextValues[key];
    submit.mock = vi.fn().mockResolvedValue({});
  });

  it('shows the recorded village for a village registry', () => {
    renderModal(
      registration({ programRegistry: { currentlyAtType: 'village' }, villageId: 'village-1' }),
    );

    const villageField = screen.getByRole('button', { name: 'villageId' });
    expect(villageField.getAttribute('data-endpoint')).toBe('village');
    expect(villageField.getAttribute('data-value')).toBe('village-1');
    expect(screen.queryByRole('button', { name: 'facilityId' })).toBeNull();
  });

  it('shows the recorded facility for a facility registry', () => {
    renderModal(
      registration({ programRegistry: { currentlyAtType: 'facility' }, facilityId: 'facility-1' }),
    );

    const facilityField = screen.getByRole('button', { name: 'facilityId' });
    expect(facilityField.getAttribute('data-endpoint')).toBe('facility');
    expect(facilityField.getAttribute('data-value')).toBe('facility-1');
    expect(screen.queryByRole('button', { name: 'villageId' })).toBeNull();
  });

  it('saves null when the recorded place is cleared', async () => {
    renderModal(
      registration({ programRegistry: { currentlyAtType: 'village' }, villageId: 'village-1' }),
    );

    nextValues.villageId = undefined;
    fireEvent.click(screen.getByRole('button', { name: 'villageId' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(submit.mock).toHaveBeenCalled());
    expect(submit.mock.mock.calls[0][0]).toMatchObject({ villageId: null });
  });
});
