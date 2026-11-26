import * as React from 'react';
import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';
import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';
import { GenericPrimaryDetailsLayout } from '../../app/forms/PatientDetailsForm/layouts/generic/GenericLayout';
import { renderElementWithTranslatedText } from '../helpers';

let settings = {};
const getSetting = key => settings[key];

vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting }),
}));

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ facilityId: 'facility-1', ability: { can: () => true } }),
}));

vi.mock('../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useApi: () => ({ get: vi.fn().mockResolvedValue([]) }),
  useSuggester: () => ({
    fetchCurrentOption: vi.fn().mockResolvedValue(null),
    fetchSuggestions: vi.fn().mockResolvedValue([]),
  }),
}));

const renderLayout = () =>
  renderElementWithTranslatedText(
    <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
      <SettingsContext.Provider value={{ getSetting }}>
        <DateTimeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Formik initialValues={{}} initialStatus={{}} onSubmit={() => {}}>
              <GenericPrimaryDetailsLayout
                patientRegistryType={PATIENT_REGISTRY_TYPES.NEW_PATIENT}
                isRequiredPatientData={() => false}
              />
            </Formik>
          </LocalizationProvider>
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );

describe('GenericPrimaryDetailsLayout', () => {
  it('has no QR scanning on cultural name by default', () => {
    settings = {};
    renderLayout();

    expect(screen.getByTestId('localisedfield-ew4s-input')).toBeTruthy();
    expect(screen.queryByTestId('qr-scanner-button-culturalName')).toBeNull();
  });

  it('offers QR scanning on cultural name when its QR code scanner customisation is set', () => {
    settings = {
      'customisations.componentVersions': { CulturalNameTextField: 'qrCodeScanner' },
    };
    renderLayout();

    expect(screen.getByTestId('qr-scanner-button-culturalName')).toBeTruthy();
    expect(screen.getByTestId('localisedfield-ew4s-input')).toBeTruthy();
  });
});
