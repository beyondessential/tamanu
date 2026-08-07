import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { ENCOUNTER_TYPES, PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES } from '@tamanu/constants';
import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

import { renderElementWithTranslatedText } from '../helpers';

// Settings and encounter type are per-test, so the stubbed providers read from these.
const settings = {};
let encounter = null;
let canCreateMedicationRequest = true;

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => ({ get: vi.fn(), post: vi.fn() }),
    useSuggester: () => ({
      fetchSuggestions: vi.fn().mockResolvedValue([]),
      fetchCurrentOption: vi.fn().mockResolvedValue(null),
    }),
  };
});

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({
    currentUser: { id: 'user-1' },
    ability: {
      can: (action, subject) =>
        subject === 'MedicationRequest' ? canCreateMedicationRequest : true,
    },
  }),
}));

vi.mock('../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter, loadEncounter: vi.fn() }),
}));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ patient: { id: 'patient-1', dateOfBirth: '1990-01-01' } }),
}));

vi.mock('../../app/api/queries/useEncounterMedicationQuery', () => ({
  useEncounterMedicationQuery: () => ({ data: { data: [] } }),
}));

vi.mock('../../app/api/queries/useDispensingUnit', () => ({ default: () => ({ data: null }) }));

vi.mock('../../app/hooks/useMedicationIdealTimes', () => ({
  useMedicationIdealTimes: () => ({ defaultTimeSlots: [], idealTimes: [] }),
}));

vi.mock('../../app/components/PatientAllergiesWarning', () => ({ default: () => null }));

vi.mock('../../app/components/PatientPrinting', () => ({ PrintPrescriptionModal: () => null }));

vi.mock('../../app/components/Medication/FrequencySearchInput', () => ({
  FrequencySearchField: ({ field }) => (
    <input data-testid="frequency-input" value={field?.value ?? ''} readOnly />
  ),
}));

const { SettingsContext, DateTimeProviderContext } = await import('@tamanu/ui-components');
const { MedicationForm } = await import('../../app/forms/MedicationForm');

const SEND_TO_PHARMACY = 'medication-field-sendToPharmacy-6r4d';

const dateTimeValue = {
  primaryTimeZone: 'Australia/Melbourne',
  facilityTimeZone: null,
  locale: 'en-AU',
  ...Object.fromEntries(Object.keys(dateTimeFormatters).map(name => [name, () => ''])),
  getCurrentDate: () => '2026-08-05',
  getCurrentDateTime: () => '2026-08-05 09:00:00',
  getFacilityNowDate: () => new Date('2026-08-05T09:00:00'),
  getDayBoundaries: () => null,
  toStoredDateTime: value => value,
  toFacilityDateTime: value => value,
  storedDateTimeToEpochMilliseconds: () => 0,
};

const renderForm = (props = {}) =>
  renderElementWithTranslatedText(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <SettingsContext.Provider value={{ getSetting: path => settings[path] }}>
        <DateTimeProviderContext.Provider value={dateTimeValue}>
          <MedicationForm
            encounterId="encounter-1"
            onCancel={() => {}}
            onSaved={() => {}}
            {...props}
          />
        </DateTimeProviderContext.Provider>
      </SettingsContext.Provider>
    </LocalizationProvider>,
  );

const sendToPharmacyCheckbox = () =>
  screen.getByTestId(`${SEND_TO_PHARMACY}-controlcheck`, { exact: false });

// TranslatedRadioField overrides the caller's data-testid, so match the radios by accessible name.
const prescriptionTypeRadio = name => screen.getByRole('radio', { name });

describe('MedicationForm send to pharmacy', () => {
  beforeEach(() => {
    settings['features.pharmacyOrder.enabled'] = true;
    settings['medications.pharmacyOrder.defaultPrescriptionType'] =
      PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES.ENCOUNTER_TYPE;
    settings['medications.dispensing.dispensingQuantityAutocalculation'] = false;
    settings['medications.defaultAdministrationTimes'] = {};
    encounter = { id: 'encounter-1', encounterType: ENCOUNTER_TYPES.ADMISSION };
    canCreateMedicationRequest = true;
  });

  it('hides the whole section when the pharmacy order feature is disabled', () => {
    settings['features.pharmacyOrder.enabled'] = false;
    renderForm();

    expect(screen.queryByText('Send to pharmacy')).toBeNull();
    expect(screen.queryByTestId(`${SEND_TO_PHARMACY}-controlcheck`)).toBeNull();
  });

  it('hides the section for prescriptions recorded outside an encounter', () => {
    renderForm({ encounterId: undefined, isOngoingPrescription: true });

    expect(screen.queryByTestId(`${SEND_TO_PHARMACY}-controlcheck`)).toBeNull();
  });

  it('hides the section without permission to create a medication request', () => {
    canCreateMedicationRequest = false;
    renderForm();

    expect(screen.queryByTestId(`${SEND_TO_PHARMACY}-controlcheck`)).toBeNull();
  });

  it('offers the checkbox unselected, with prescription type hidden', () => {
    renderForm();

    expect(sendToPharmacyCheckbox().checked).toBe(false);
    expect(screen.queryByText('Prescription type')).toBeNull();
  });

  it('reveals prescription type when send to pharmacy is selected, and hides it again on deselect', () => {
    renderForm();

    fireEvent.click(sendToPharmacyCheckbox());
    expect(screen.queryByText('Prescription type')).not.toBeNull();

    fireEvent.click(sendToPharmacyCheckbox());
    expect(screen.queryByText('Prescription type')).toBeNull();
  });

  it.each([
    [PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES.INPATIENT, ENCOUNTER_TYPES.CLINIC, 'Inpatient'],
    [
      PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES.OUTPATIENT_OR_DISCHARGE,
      ENCOUNTER_TYPES.ADMISSION,
      'Outpatient/Discharge',
    ],
    [
      PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES.ENCOUNTER_TYPE,
      ENCOUNTER_TYPES.ADMISSION,
      'Inpatient',
    ],
    [
      PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES.ENCOUNTER_TYPE,
      ENCOUNTER_TYPES.CLINIC,
      'Outpatient/Discharge',
    ],
  ])(
    'defaults prescription type in %s mode on a %s encounter to %s',
    (mode, encounterType, expectedLabel) => {
      settings['medications.pharmacyOrder.defaultPrescriptionType'] = mode;
      encounter = { id: 'encounter-1', encounterType };
      renderForm();

      fireEvent.click(sendToPharmacyCheckbox());

      expect(prescriptionTypeRadio(expectedLabel).checked).toBe(true);
    },
  );

  it('keeps a prescription type selected when the selected option is clicked again', () => {
    renderForm();

    fireEvent.click(sendToPharmacyCheckbox());
    expect(prescriptionTypeRadio('Inpatient').checked).toBe(true);

    fireEvent.click(prescriptionTypeRadio('Inpatient'));

    expect(prescriptionTypeRadio('Inpatient').checked).toBe(true);
  });

  it('marks dispensing quantity as required only while send to pharmacy is selected', () => {
    // The asterisk is a CSS ::before; RequiredOrnament's visually hidden text is what we can read.
    const quantityLabel = () =>
      screen.getByText('Dispensing quantity').closest('label').textContent;

    renderForm();
    expect(quantityLabel()).not.toContain('Required');

    fireEvent.click(sendToPharmacyCheckbox());
    expect(quantityLabel()).toContain('Required');

    fireEvent.click(sendToPharmacyCheckbox());
    expect(quantityLabel()).not.toContain('Required');
  });
});
