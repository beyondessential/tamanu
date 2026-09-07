import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { createTheme } from '@material-ui/core/styles';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { apiGet, stableApi } = vi.hoisted(() => {
  const get = vi.fn(async () => ({ data: [], count: 0 }));
  return { apiGet: get, stableApi: { get } };
});

vi.mock('../../../app/api', async () => ({
  ...(await vi.importActual('../../../app/api')),
  useApi: () => stableApi,
}));

vi.mock('@tamanu/ui-components', async () => ({
  ...(await vi.importActual('@tamanu/ui-components')),
  useApi: () => stableApi,
  useDateTime: () => ({ getCurrentDateTime: () => '2026-09-07 10:00' }),
}));

vi.mock('../../../app/contexts/Auth', async () => ({
  ...(await vi.importActual('../../../app/contexts/Auth')),
  useAuth: () => ({ ability: { can: () => true }, facilityId: 'facility-1' }),
}));

vi.mock('../../../app/contexts/Settings', async () => ({
  ...(await vi.importActual('../../../app/contexts/Settings')),
  useSettings: () => ({ getSetting: () => undefined }),
}));

vi.mock('../../../app/contexts/Translation', async () => ({
  ...(await vi.importActual('../../../app/contexts/Translation')),
  useTranslation: () => ({
    getTranslation: (_id, fallback) => fallback,
    getEnumTranslation: (_values, value) => value,
  }),
}));

import { TranslationProvider } from '../../../app/contexts/Translation';
import { EncounterMedicationTable } from '../../../app/components/Medication/MedicationTable';

const ENCOUNTER = { id: 'encounter-1', patientId: 'patient-1' };

const TRANSLATION_CONTEXT = {
  getTranslation: (_id, fallback) => fallback,
  getEnumTranslation: (_values, value) => value,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

// The table and the query hit the same endpoint; only the table asks for a sort order.
const tableFetchCount = () =>
  apiGet.mock.calls.filter(
    ([endpoint, params]) => endpoint.endsWith('/medications') && params?.orderBy,
  ).length;

describe('EncounterMedicationTable', () => {
  beforeEach(() => {
    apiGet.mockClear();
  });

  it('refetches when the encounter medication query is invalidated', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={createTheme({})}>
          <TranslationProvider value={TRANSLATION_CONTEXT}>
            <MemoryRouter>
              <EncounterMedicationTable encounter={ENCOUNTER} />
            </MemoryRouter>
          </TranslationProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(tableFetchCount()).toBeGreaterThan(0));
    const before = tableFetchCount();

    queryClient.invalidateQueries(['encounterMedication', ENCOUNTER.id]);

    await waitFor(() => expect(tableFetchCount()).toBeGreaterThan(before));
  });
});
