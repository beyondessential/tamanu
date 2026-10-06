import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { createTheme } from '@material-ui/core/styles';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { permissions, stableApi } = vi.hoisted(() => ({
  permissions: { canSyncPatient: false },
  stableApi: { get: async () => ({ data: [], count: 0 }), post: async () => ({}) },
}));

vi.mock('@tamanu/ui-components', async () => ({
  ...(await vi.importActual('@tamanu/ui-components')),
  useApi: () => stableApi,
}));

vi.mock('../../app/contexts/Auth', async () => ({
  ...(await vi.importActual('../../app/contexts/Auth')),
  useAuth: () => ({
    ability: {
      can: (verb, noun) => (noun === 'SyncPatient' ? permissions.canSyncPatient : true),
    },
    facilityId: 'facility-1',
  }),
}));

import { TranslationProvider } from '../../app/contexts/Translation';
import { PatientHistory } from '../../app/components/PatientHistory';

const TRANSLATION_CONTEXT = {
  getTranslation: (_id, fallback) => fallback,
  getEnumTranslation: (_values, value) => value,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const UNSYNCED_PATIENT = { id: 'patient-1', markedForSync: false };

const renderPatientHistory = patient =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={createTheme({})}>
        <TranslationProvider value={TRANSLATION_CONTEXT}>
          <MemoryRouter>
            <PatientHistory patient={patient} onItemClick={() => {}} />
          </MemoryRouter>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

describe('PatientHistory for a patient not marked for sync', () => {
  beforeEach(() => {
    permissions.canSyncPatient = false;
  });

  it('offers to sync the patient to a user with create SyncPatient', () => {
    permissions.canSyncPatient = true;

    renderPatientHistory(UNSYNCED_PATIENT);

    expect(screen.getByRole('button', { name: /Sync patient records/ })).toBeTruthy();
    expect(screen.queryByText(/not marked for sync at your facility/)).toBeNull();
  });

  it('explains the patient is not synced to a user without create SyncPatient', () => {
    renderPatientHistory(UNSYNCED_PATIENT);

    expect(screen.getByText(/not marked for sync at your facility/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Sync patient records/ })).toBeNull();
  });
});
