import React, { forwardRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ADMINISTRATION_FREQUENCIES, MEDICATION_DURATION_UNITS } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../../helpers';

const mocks = vi.hoisted(() => ({
  createMedicationSet: vi.fn(),
  toastError: vi.fn(),
  medicationSets: [],
}));

vi.mock('react-toastify', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, toast: { ...actual.toast, error: mocks.toastError } };
});

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' }, ability: { can: () => true } }),
}));

vi.mock('../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter: { id: 'encounter-1', patientId: 'patient-1' } }),
}));

vi.mock('../../../app/api/queries/useSuggestionsQuery', () => ({
  useSuggestionsQuery: () => ({ data: mocks.medicationSets, isLoading: false }),
}));

vi.mock('../../../app/api/mutations/useMarMutation', () => ({
  useCreateMedicationSetMutation: () => ({
    mutateAsync: mocks.createMedicationSet,
    isLoading: false,
  }),
}));

vi.mock('../../../app/components/PatientAllergiesWarning', () => ({ default: () => null }));

vi.mock('../../../app/forms/MedicationForm', () => ({ MedicationForm: () => null }));

vi.mock('../../../app/components/PatientPrinting/modals/MultiplePrescriptionPrintoutModal', () => ({
  MultiplePrescriptionPrintoutModal: () => <div data-testid="print-modal" />,
}));

// The lists only matter here as a way into the review screen, so they are stubbed down to the
// set name and a click target.
vi.mock('../../../app/components/Medication/MedicationSetList', () => ({
  MedicationSetList: forwardRef(({ medicationSets, onSelect }, ref) => (
    <div ref={ref}>
      {medicationSets.map(set => (
        <button key={set.id} type="button" onClick={() => onSelect(set)}>
          {set.name}
        </button>
      ))}
    </div>
  )),
  MedicationSetMedicationsList: ({ medicationSet: { name } }) => <div>{name} medications</div>,
}));

const { SettingsContext, DateTimeProviderContext } = await import('@tamanu/ui-components');
const { buildMedicationSetPrescription, MedicationSetModal } = await import(
  '../../../app/components/Medication/MedicationSetModal'
);

// A medication-set template as it arrives from the medicationSet suggester: the template fields
// plus the nested drug reference data the frontend relies on for autocalculation.
const buildTemplate = overrides => ({
  medication: {
    id: 'drug-1',
    name: 'Paracetamol',
    referenceDrug: { dispensingUnit: 'Tablet', unitConversion: 250 },
  },
  frequency: ADMINISTRATION_FREQUENCIES.DAILY,
  route: 'oral',
  doseAmount: 500,
  dosingUnit: 'mg',
  durationValue: 10,
  durationUnit: MEDICATION_DURATION_UNITS.DAYS,
  ...overrides,
});

const context = {
  startDate: '2024-03-15 08:00:00',
  date: '2024-03-15',
  prescriberId: 'user-1',
  isDispensingQuantityAutocalculationEnabled: true,
};

describe('buildMedicationSetPrescription', () => {
  it('snapshots the dispensing unit and conversion from the reference drug', () => {
    const child = buildMedicationSetPrescription(buildTemplate(), context);
    expect(child.dispensingUnit).toBe('Tablet');
    expect(child.unitConversion).toBe(250);
  });

  it('autocalculates the dispensing quantity when the setting is enabled', () => {
    const child = buildMedicationSetPrescription(buildTemplate(), context);
    // 500 dosing units × 1 dose/day × 10 days ÷ 250 units-per-tablet = 20 tablets
    expect(child.quantity).toBe(20);
  });

  it('does not set a quantity when autocalculation is disabled', () => {
    const child = buildMedicationSetPrescription(buildTemplate(), {
      ...context,
      isDispensingQuantityAutocalculationEnabled: false,
    });
    expect(child.quantity).toBeUndefined();
  });

  it('does not set a quantity when the template is not calculable (variable dose)', () => {
    const child = buildMedicationSetPrescription(
      buildTemplate({ isVariableDose: true, doseAmount: undefined }),
      context,
    );
    expect(child.quantity).toBeUndefined();
  });

  describe('missing reference drug', () => {
    it('falls back to a blank dispensing unit and a conversion of 1', () => {
      const child = buildMedicationSetPrescription(
        buildTemplate({ medication: { id: 'drug-2', name: 'Amoxicillin' } }),
        context,
      );
      expect(child.dispensingUnit).toBe('');
      expect(child.unitConversion).toBe(1);
    });

    it('still autocalculates using the fallback conversion of 1', () => {
      const child = buildMedicationSetPrescription(
        buildTemplate({ medication: { id: 'drug-2', name: 'Amoxicillin' } }),
        context,
      );
      // With a conversion of 1: 500 × 1/day × 10 days ÷ 1 = 5000
      expect(child.quantity).toBe(5000);
    });
  });
});

const dateTimeValue = {
  getCurrentDate: () => context.date,
  getCurrentDateTime: () => context.startDate,
};

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  getEnumTranslation: (enumValues, value) => enumValues[value] ?? value,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderModal = () =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => false }}>
      <DateTimeProviderContext.Provider value={dateTimeValue}>
        <MedicationSetModal
          open
          onClose={() => {}}
          openPrescriptionTypeModal={() => {}}
          onReloadTable={() => {}}
        />
      </DateTimeProviderContext.Provider>
    </SettingsContext.Provider>,
    undefined,
    translationContext,
  );

const goToReviewScreen = () => {
  renderModal();
  fireEvent.click(screen.getByRole('button', { name: 'Set A' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
};

describe('MedicationSetModal finalise all & print', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.medicationSets = [
      { id: 'set-1', name: 'Set A', children: [{ medicationTemplate: buildTemplate() }] },
    ];
  });

  it('does not open the print modal when the prescriptions fail to save', async () => {
    mocks.createMedicationSet.mockRejectedValue(new Error('Start date cannot be in the past'));
    goToReviewScreen();

    fireEvent.click(screen.getByRole('button', { name: 'Finalise all & print' }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith('Start date cannot be in the past'),
    );
    expect(screen.queryByTestId('print-modal')).toBeNull();
  });

  it('opens the print modal once the prescriptions are saved', async () => {
    mocks.createMedicationSet.mockResolvedValue({});
    goToReviewScreen();

    fireEvent.click(screen.getByRole('button', { name: 'Finalise all & print' }));

    await waitFor(() => expect(screen.queryByTestId('print-modal')).not.toBeNull());
    expect(mocks.toastError).not.toHaveBeenCalled();
  });
});
