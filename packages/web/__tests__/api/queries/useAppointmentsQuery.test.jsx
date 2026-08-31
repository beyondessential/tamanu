import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { createQueryClient } from '../../helpers';
import {
  useHasPastLocationBookingsQuery,
  useHasPastOutpatientAppointmentsQuery,
} from '../../../app/api/queries/useAppointmentsQuery';

const getMock = vi.fn();

vi.mock('../../../app/api/useApi', () => ({ useApi: () => ({ get: getMock }) }));
vi.mock('../../../app/contexts/Auth', () => ({ useAuth: () => ({ facilityId: 'facility-1' }) }));

const ENDPOINT = 'appointments/hasPastAppointments/patient-1';

describe('useHasPastAppointmentsQuery', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue(false);
  });

  it('keeps the outpatient and location-booking variants in separate cache entries', async () => {
    // Both variants hit the same endpoint and differ only by the type param, so a key that
    // omits it makes them collide and whichever mounts first answers for both.
    const client = createQueryClient();
    renderHook(
      () => {
        useHasPastOutpatientAppointmentsQuery('patient-1');
        useHasPastLocationBookingsQuery('patient-1');
      },
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      },
    );

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    expect(getMock).toHaveBeenCalledWith(ENDPOINT, {
      facilityId: 'facility-1',
      type: 'outpatient',
    });
    expect(getMock).toHaveBeenCalledWith(ENDPOINT, {
      facilityId: 'facility-1',
      type: 'locationBooking',
    });
  });
});
