import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { route } from '@tamanu/api-client';

import { createQueryClient } from '../../helpers';
import { useImagingRequestQuery } from '../../../app/api/queries/useImagingRequestQuery';

const getMock = vi.fn();

vi.mock('../../../app/api/useApi', () => ({ useApi: () => ({ get: getMock }) }));
vi.mock('../../../app/contexts/Auth', () => ({ useAuth: () => ({ facilityId: 'facility-1' }) }));

describe('useImagingRequestQuery', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({ id: 'imaging-request-1' });
  });

  it('sends the facility id', async () => {
    // The server resolves the imaging integration from the facility's settings, so without
    // the facility id no result gets an external link.
    const client = createQueryClient();
    renderHook(() => useImagingRequestQuery('imaging-request-1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));
    expect(getMock).toHaveBeenCalledWith(
      route('imagingRequest/:imagingRequestId', { imagingRequestId: 'imaging-request-1' }),
      { facilityId: 'facility-1' },
    );
  });
});
