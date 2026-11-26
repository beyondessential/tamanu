import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';
import { TranslationProvider } from '../../app/contexts/Translation';
import { createQueryClient, createStubTheme } from '../helpers';

const { patientRef } = vi.hoisted(() => ({ patientRef: { current: null } }));

const LIST_RESPONSES = {
  allergies: [
    {
      id: 'allergy-1',
      allergy: { id: 'allergy-peanuts', name: 'Peanuts' },
      reaction: { id: 'reaction-hives', name: 'Hives' },
    },
  ],
  conditions: [
    {
      id: 'condition-1',
      condition: { id: 'diag-gout', name: 'Gout' },
      recordedDate: '2026-01-02 00:00:00',
      resolved: true,
    },
  ],
};

vi.mock('../../app/api', () => ({
  useApi: () => ({
    get: async endpoint => {
      const section = String(endpoint?.template ?? endpoint)
        .split('/')
        .pop();
      return { data: LIST_RESPONSES[section] ?? [] };
    },
  }),
}));
vi.mock('../../app/contexts/Patient', () => ({
  usePatient: () => ({ patient: patientRef.current }),
}));
vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true } }),
}));
vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: () => false }),
}));
vi.mock('../../app/contexts/SyncState', () => ({
  useSyncState: () => ({ isPatientSyncing: () => false }),
}));
vi.mock('../../app/contexts/NoteModal', () => ({
  useNoteModal: () => ({ isNoteModalOpen: false }),
}));
vi.mock('../../app/utils/usePatientNavigation', () => ({
  usePatientNavigation: () => ({
    navigateToPatient: () => {},
    navigateToProgramRegistry: () => {},
  }),
}));
vi.mock('../../app/components/PatientPrinting', () => ({ PrintPatientDetailsModal: () => null }));
vi.mock('../../app/components/DeathModal', () => ({ DeathModal: () => null }));
vi.mock('../../app/components/AiPatientSummary', () => ({ AiPatientSummary: () => null }));
vi.mock('../../app/components/RecordDeathSection', () => ({ RecordDeathSection: () => null }));

import { PatientInfoPane } from '../../app/components/PatientInfoPane/PatientInfoPane';

const translationContext = {
  getTranslation: (_id, fallback) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const COLLAPSE_SECTION_IDS = ['conditions', 'allergies', 'familyHistory', 'issues'];

const renderPane = patient => {
  patientRef.current = {
    id: 'patient-1',
    displayId: 'TEST000001',
    firstName: 'Sina',
    lastName: 'Testpatient',
    sex: 'female',
    dateOfBirth: '1990-05-15',
    ...patient,
  };
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ThemeProvider theme={createStubTheme()}>
        <TranslationProvider value={translationContext}>
          <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
            <SettingsContext.Provider value={{ getSetting: () => undefined }}>
              <DateTimeProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <PatientInfoPane />
                </LocalizationProvider>
              </DateTimeProvider>
            </SettingsContext.Provider>
          </AuthContext.Provider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe('PatientInfoPane', () => {
  it('shows an allergy’s reaction and a resolved condition as pills on their rows', async () => {
    renderPane();

    expect((await screen.findByTestId('reactionpill-allergy')).textContent).toBe('Hives');
    expect(screen.getByTestId('reactionpill-allergy').closest('button').textContent).toContain(
      'Peanuts',
    );
    expect(screen.getByTestId('resolvedpill-condition').closest('button').textContent).toContain(
      'Gout',
    );
  });

  it('offers Add in every section and no Deceased tag for a living patient', async () => {
    renderPane();
    await screen.findByText('Peanuts');

    expect(screen.queryByTestId('deceasedtag-sidebar')).toBeNull();
    for (const sectionId of COLLAPSE_SECTION_IDS) {
      const section = screen.getByTestId(`infopanelist-${sectionId}`);
      expect(within(section).queryByTestId('addbutton-b0ln')).toBeTruthy();
    }
  });

  it('marks a deceased patient in the header and offers no Add in the clinical sections', async () => {
    renderPane({ dateOfDeath: '2026-03-01 10:00:00' });
    await screen.findByText('Peanuts');

    expect(screen.getByTestId('deceasedtag-sidebar').textContent).toBe('Deceased');
    expect(screen.getByTestId('agedisplay-gpl9').textContent).toBe(' (deceased)');
    for (const sectionId of COLLAPSE_SECTION_IDS) {
      const section = screen.getByTestId(`infopanelist-${sectionId}`);
      expect(within(section).queryByTestId('addbutton-b0ln')).toBeNull();
    }
  });
});
