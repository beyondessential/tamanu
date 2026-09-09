import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { createQueryClient } from '../../helpers';
import { useDispensableMedicationsQuery } from '../../../app/api/queries/useDispensableMedicationsQuery';

const getMock = vi.fn().mockResolvedValue({ data: [] });

vi.mock('../../../app/api', () => ({
  useApi: () => ({ get: getMock }),
}));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ facilityId: 'facility-1' }),
}));

const renderQuery = (patientId, options) =>
  renderHook(() => useDispensableMedicationsQuery(patientId, options), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
    ),
  });

describe('useDispensableMedicationsQuery', () => {
  beforeEach(() => getMock.mockClear());

  it('fetches the dispensable medications for a patient', async () => {
    renderQuery('patient-1', { enabled: true });

    await waitFor(() =>
      expect(getMock).toHaveBeenCalledWith('medication/dispensable-medications', {
        patientId: 'patient-1',
        facilityId: 'facility-1',
      }),
    );
  });

  it('does not fetch without a patient, even when the caller enables it', async () => {
    renderQuery(undefined, { enabled: true });

    await waitFor(() => expect(getMock).not.toHaveBeenCalled());
  });
});
