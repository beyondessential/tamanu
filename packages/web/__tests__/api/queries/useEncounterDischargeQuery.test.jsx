import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ERROR_TYPE } from '@tamanu/errors';

import { createQueryClient } from '../../helpers';
import { useEncounterDischargeQuery } from '../../../app/api/queries/useEncounterDischargeQuery';

const getMock = vi.fn();

vi.mock('../../../app/api', () => ({
  useApi: () => ({ get: getMock }),
}));

const dischargedEncounter = { id: 'encounter-1', endDate: '2023-05-09 23:58:59' };
const activeEncounter = { id: 'encounter-2', endDate: null };

// What `api.get` actually rejects with: a Problem built from the HTTP response, carrying the
// error taxonomy `type` and the status, rather than an instance of an error class.
const problem = (message, type, status) => Object.assign(new Error(message), { type, status });

// Reject lazily, when the hook calls `get`, so the rejection is created inside the hook's own
// handling rather than sitting unhandled from the moment the mock is set up.
const rejectWith = error => getMock.mockImplementation(() => Promise.reject(error));

const renderQuery = (encounter, options) =>
  renderHook(() => useEncounterDischargeQuery(encounter, options), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
    ),
  });

// `clearMocks` in the vitest config clears recorded calls between cases; each case that fetches
// sets its own implementation.
describe('useEncounterDischargeQuery', () => {
  it('returns the discharge record for a discharged encounter', async () => {
    const discharge = { id: 'discharge-1', encounterId: 'encounter-1' };
    getMock.mockResolvedValue(discharge);

    const { result } = renderQuery(dischargedEncounter);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith('encounter/encounter-1/discharge');
    expect(result.current.data).toEqual(discharge);
  });

  it('resolves null, not an error, when the encounter has no discharge record', async () => {
    rejectWith(problem('Not found', ERROR_TYPE.NOT_FOUND, 404));

    const { result } = renderQuery(dischargedEncounter);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('still surfaces other errors', async () => {
    rejectWith(problem('Server error', ERROR_TYPE.REMOTE, 500));

    const { result } = renderQuery(dischargedEncounter);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch for an encounter without an end date', async () => {
    renderQuery(activeEncounter);

    await waitFor(() => expect(getMock).not.toHaveBeenCalled());
  });

  it('does not fetch when the caller disables it', async () => {
    renderQuery(dischargedEncounter, { enabled: false });

    await waitFor(() => expect(getMock).not.toHaveBeenCalled());
  });
});
