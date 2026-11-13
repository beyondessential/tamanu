/*
 * The lab request view shows the request named by its URL. It used to render whichever request
 * was last loaded into a root-level context, so browser Back/Forward could show one request's
 * details, status actions and label under another request's URL and patient banner.
 */

import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { resolveEndpoint } from '@tamanu/api-client';

import { createQueryClient, renderElementWithTranslatedText } from '../../helpers';

const mockGet = vi.fn();

vi.mock('../../../app/api/useApi', () => ({
  useApi: () => ({ get: mockGet, user: { id: 'user-1' } }),
}));
vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({ getCurrentDateTime: () => '2026-01-01 00:00:00' }),
}));
vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true } }),
}));
vi.mock('../../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: () => false }),
}));
vi.mock('../../../app/contexts/Patient', () => ({
  usePatient: () => ({ patient: { id: 'patient-1' } }),
}));
vi.mock('../../../app/components/NoteModalActionBlocker', () => ({
  NoteModalActionBlocker: ({ children }) => children,
}));
vi.mock('../../../app/views/patients/components/LabRequestCard', () => ({
  LabRequestCard: ({ labRequest }) => (
    <div data-testid="lab-request-card">{labRequest.displayId}</div>
  ),
}));
vi.mock('../../../app/forms/LabRequestNoteForm', () => ({ LabRequestNoteForm: () => null }));
vi.mock('../../../app/views/patients/components/LabRequestResultsTable', () => ({
  LabRequestResultsTable: () => null,
}));
vi.mock('../../../app/components', async importOriginal => ({
  ...(await importOriginal()),
  DateDisplay: () => null,
  MenuButton: () => null,
  Tile: () => null,
}));

import { LabRequestView } from '../../../app/views/patients/LabRequestView';

const labRequestRoute = (labRequestId, encounterId = 'encounter-1') =>
  `/patients/all/patient-1/encounter/${encounterId}/lab-request/${labRequestId}`;

const LAB_REQUESTS = {
  'lr-1': {
    id: 'lr-1',
    displayId: 'LAB-ONE',
    encounterId: 'encounter-1',
    status: 'reception_pending',
  },
  'lr-2': {
    id: 'lr-2',
    displayId: 'LAB-TWO',
    encounterId: 'encounter-1',
    status: 'reception_pending',
  },
};

const GoToSecondRequest = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(labRequestRoute('lr-2'))}>
      go to second request
    </button>
  );
};

const renderAt = initialEntry =>
  renderElementWithTranslatedText(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <GoToSecondRequest />
        <Routes>
          <Route
            path="/patients/:category/:patientId/encounter/:encounterId/lab-request/:labRequestId"
            element={<LabRequestView />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('LabRequestView', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async endpoint => {
      const [, labRequestId] = resolveEndpoint(endpoint).split('/');
      const labRequest = LAB_REQUESTS[labRequestId];
      if (!labRequest) throw new Error('Not found');
      return labRequest;
    });
  });

  it('loads the lab request named by the URL', async () => {
    renderAt(labRequestRoute('lr-1'));

    await waitFor(() => expect(screen.getByTestId('lab-request-card').textContent).toBe('LAB-ONE'));
    expect(resolveEndpoint(mockGet.mock.calls[0][0])).toBe('labRequest/lr-1');
  });

  it('swaps the lab request when navigation changes the URL', async () => {
    renderAt(labRequestRoute('lr-1'));
    await waitFor(() => expect(screen.getByTestId('lab-request-card').textContent).toBe('LAB-ONE'));

    await userEvent.click(screen.getByText('go to second request'));

    await waitFor(() => expect(screen.getByTestId('lab-request-card').textContent).toBe('LAB-TWO'));
    expect(screen.queryByText('LAB-ONE')).toBeNull();
  });

  it('refuses a lab request that does not belong to the encounter in the URL', async () => {
    renderAt(labRequestRoute('lr-1', 'another-encounter'));

    await waitFor(() => expect(screen.getByText('Cannot load lab request')).toBeTruthy());
    expect(screen.queryByTestId('lab-request-card')).toBeNull();
  });

  it('shows an error when the lab request cannot be fetched', async () => {
    renderAt(labRequestRoute('missing'));

    await waitFor(() => expect(screen.getByText('Cannot load lab request')).toBeTruthy());
  });
});
