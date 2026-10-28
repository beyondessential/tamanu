import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '../../helpers';
import { useKioskCheckInMutation } from '../../../app/views/kiosk/kioskApi';

const api = { post: vi.fn(() => Promise.resolve({})) };
vi.mock('../../../app/api', () => ({ useApi: () => api }));

describe('Kiosk check-in', () => {
  it('fails the check-in, without sending it, when the answers cannot be prepared', async () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useKioskCheckInMutation('appointment-1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });
    act(() => result.current.mutate(() => Promise.reject(new Error('Photo could not be read'))));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(api.post).not.toHaveBeenCalled();
  });
});
