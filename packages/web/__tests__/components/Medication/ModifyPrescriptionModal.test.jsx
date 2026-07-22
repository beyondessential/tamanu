import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../../helpers';
import {
  appendPharmacyNote,
  ModifyPrescriptionModal,
} from '../../../app/components/Medication/ModifyPrescriptionModal';

describe('appendPharmacyNote', () => {
  const note = 'This prescription has been modified by pharmacy when dispensing.';

  it('returns just the note when there is no existing note', () => {
    expect(appendPharmacyNote('', note)).toBe(note);
    expect(appendPharmacyNote(null, note)).toBe(note);
    expect(appendPharmacyNote(undefined, note)).toBe(note);
    expect(appendPharmacyNote('   ', note)).toBe(note);
  });

  it('appends the note on a new line after an existing note', () => {
    expect(appendPharmacyNote('Take with food', note)).toBe(`Take with food\n${note}`);
  });

  it('does not duplicate the note if it is already present', () => {
    const existing = `Take with food\n${note}`;
    expect(appendPharmacyNote(existing, note)).toBe(existing);
  });
});

// Leaf field components are stubbed so we can drive Formik state directly and observe it;
// `Field` (the Formik connector) stays real so value/onChange wiring is exercised.
vi.mock('../../../app/components/Field', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    NumberField: ({ field, disabled, ['data-testid']: testId }) => (
      <input
        data-testid={`${testId}-input`}
        value={field?.value ?? ''}
        disabled={disabled}
        readOnly
      />
    ),
    // Renders as a button; clicking flips the Formik boolean and fires the passed onChange(_, next)
    CheckField: ({ field, onChange, disabled, ['data-testid']: testId }) => (
      <button
        type="button"
        data-testid={testId}
        data-checked={String(Boolean(field?.value))}
        disabled={disabled}
        onClick={() => {
          const next = !field?.value;
          field.onChange({ target: { name: field.name, value: next } });
          onChange?.({ target: { name: field.name, value: next } }, next);
        }}
      >
        toggle
      </button>
    ),
    AutocompleteField: ({ field, ['data-testid']: testId }) => (
      <input data-testid={`${testId}-input`} value={field?.value ?? ''} readOnly />
    ),
  };
});

vi.mock('../../../app/components/Medication/FrequencySearchInput', () => ({
  FrequencySearchField: ({ field }) => <input data-testid="frequency-input" value={field?.value ?? ''} readOnly />,
}));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    TextField: ({ field, ['data-testid']: testId }) => (
      <textarea data-testid={`${testId}-input`} value={field?.value ?? ''} readOnly />
    ),
    TranslatedSelectField: ({ field }) => <div>{field?.value ?? ''}</div>,
  };
});

// The modal only needs getDrugUnitLabel from this heavy module (for the unit adornment); stub it
// to avoid pulling the whole medications util graph into the test.
vi.mock('../../../app/utils/medications', () => ({
  getDrugUnitLabel: () => '',
}));

vi.mock('../../../app/api', () => ({
  useSuggester: () => ({
    fetchSuggestions: vi.fn().mockResolvedValue([]),
    fetchCurrentOption: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' } }),
}));

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const prescription = {
  medicationId: 'drug-1',
  medication: { id: 'drug-1', name: 'Paracetamol' },
  dosingUnit: 'mg',
  dispensingUnit: 'Tablet',
  isVariableDose: false,
  doseAmount: 5,
  frequency: 'Daily',
  route: 'oral',
  durationValue: '',
  durationUnit: '',
  pharmacyNotes: '',
};

const renderModal = (props = {}) =>
  renderElementWithTranslatedText(
    <ModifyPrescriptionModal
      open
      prescription={prescription}
      labelNotes="Take with food in the morning"
      onClose={() => {}}
      onConfirm={() => {}}
      {...props}
    />,
    undefined,
    translationContext,
  );

describe('ModifyPrescriptionModal form logic', () => {
  it('prefills the label notes from the workflow row', () => {
    renderModal();
    expect(screen.getByTestId('modify-prescription-label-notes-input').value).toBe(
      'Take with food in the morning',
    );
  });

  it('auto-selects and disables the "Display on MAR" checkbox', () => {
    renderModal();
    const checkbox = screen.getByTestId('modify-prescription-display-in-mar');
    expect(checkbox.getAttribute('data-checked')).toBe('true');
    expect(checkbox.disabled).toBe(true);
  });

  it('auto-appends the standard pharmacy note, keeping any existing note', () => {
    renderModal({ prescription: { ...prescription, pharmacyNotes: 'Existing note' } });
    const value = screen.getByTestId('modify-prescription-pharmacy-notes-input').value;
    expect(value.startsWith('Existing note')).toBe(true);
    expect(value).toContain('modified by pharmacy when dispensing');
  });

  it('clears the dose when variable dose is ticked and restores it when unticked', () => {
    renderModal();
    const doseInput = () => screen.getByTestId('modify-prescription-dose-input');
    expect(doseInput().value).toBe('5');

    // Tick variable dose → dose clears and disables
    fireEvent.click(screen.getByTestId('modify-prescription-variable-dose'));
    expect(doseInput().value).toBe('');
    expect(doseInput().disabled).toBe(true);

    // Untick → the original dose is restored
    fireEvent.click(screen.getByTestId('modify-prescription-variable-dose'));
    expect(doseInput().value).toBe('5');
    expect(doseInput().disabled).toBe(false);
  });
});
