import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createQueryClient } from '../helpers/render';

const mockGet = vi.fn();

vi.mock('../../app/api/useApi', () => ({ useApi: () => ({ get: mockGet }) }));

import { EncounterProvider, useEncounter } from '../../app/contexts/Encounter';

const PATIENT_ROUTE = '/patients/all/patient-1';
const encounterRoute = encounterId => `${PATIENT_ROUTE}/encounter/${encounterId}`;

const EncounterProbe = () => {
  const { encounterId, encounter, isLoadingEncounter, error } = useEncounter();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <span data-testid="pathname">{pathname}</span>
      <span data-testid="encounter-id-param">{encounterId ?? 'none'}</span>
      <span data-testid="encounter-reason">{encounter?.reasonForEncounter ?? 'none'}</span>
      <span data-testid="diagnosis-count">{encounter?.diagnoses?.length ?? 'none'}</span>
      <span data-testid="loading-state">{isLoadingEncounter ? 'loading' : 'idle'}</span>
      <span data-testid="error-status">{error ? String(error.status) : 'none'}</span>
      <button type="button" onClick={() => navigate(encounterRoute('encounter-2'))}>
        go to encounter 2
      </button>
    </div>
  );
};

const renderAt = initialEntry =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <EncounterProvider>
          <Routes>
            <Route path="/patients/:category/:patientId/*" element={<EncounterProbe />} />
          </Routes>
        </EncounterProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const httpError = status => Object.assign(new Error(`HTTP ${status}`), { status });

// Answers `encounter/:id` with the named encounter, and its related-record endpoints with nothing.
// An entry can be a status number instead, to fail that encounter's fetch with it.
const respondWithEncounters = encounters => {
  mockGet.mockImplementation(async path => {
    const [, encounterId, relation] = path.split('/');
    if (relation) return { data: [] };
    const encounter = encounters[encounterId];
    if (typeof encounter === 'number') throw httpError(encounter);
    if (!encounter) throw httpError(404);
    return encounter;
  });
};

describe('EncounterProvider', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('loads the encounter named by the URL', async () => {
    respondWithEncounters({ 'encounter-1': { id: 'encounter-1', reasonForEncounter: 'Fever' } });

    renderAt(encounterRoute('encounter-1'));

    await waitFor(() => expect(screen.getByTestId('encounter-reason').textContent).toBe('Fever'));
    expect(screen.getByTestId('encounter-id-param').textContent).toBe('encounter-1');
    expect(screen.getByTestId('diagnosis-count').textContent).toBe('0');
  });

  it('swaps the encounter when navigation changes the URL', async () => {
    respondWithEncounters({
      'encounter-1': { id: 'encounter-1', reasonForEncounter: 'Fever' },
      'encounter-2': { id: 'encounter-2', reasonForEncounter: 'Fracture' },
    });

    renderAt(encounterRoute('encounter-1'));
    await waitFor(() => expect(screen.getByTestId('encounter-reason').textContent).toBe('Fever'));

    await userEvent.click(screen.getByText('go to encounter 2'));

    await waitFor(() =>
      expect(screen.getByTestId('encounter-reason').textContent).toBe('Fracture'),
    );
  });

  it('has no encounter, and nothing to wait for, off an encounter route', () => {
    respondWithEncounters({});

    renderAt(PATIENT_ROUTE);

    expect(screen.getByTestId('encounter-id-param').textContent).toBe('none');
    expect(screen.getByTestId('encounter-reason').textContent).toBe('none');
    expect(screen.getByTestId('loading-state').textContent).toBe('idle');
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('redirects to the patient when the encounter is not viewable', async () => {
    respondWithEncounters({ 'no-permission': 403 });

    renderAt(encounterRoute('no-permission'));

    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe(PATIENT_ROUTE));
    expect(screen.getByTestId('encounter-reason').textContent).toBe('none');
  });

  it('redirects to the patient when the encounter does not exist', async () => {
    respondWithEncounters({});

    renderAt(encounterRoute('deleted-encounter'));

    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe(PATIENT_ROUTE));
  });

  it('stays put and surfaces the error when the fetch fails for any other reason', async () => {
    respondWithEncounters({ 'encounter-1': 500 });

    renderAt(encounterRoute('encounter-1'));

    await waitFor(() => expect(screen.getByTestId('error-status').textContent).toBe('500'));
    expect(screen.getByTestId('pathname').textContent).toBe(encounterRoute('encounter-1'));
  });
});
