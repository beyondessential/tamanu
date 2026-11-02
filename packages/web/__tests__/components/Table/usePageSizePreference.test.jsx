import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { createStore } from 'redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SERVER_TYPES } from '@tamanu/constants';

import { createQueryClient } from '../../helpers';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../../../app/api/useApi', () => ({ useApi: () => mockApi }));

import { usePageSizePreference } from '../../../app/components/Table/usePageSizePreference';

const PREFERENCE_KEY = 'tablePageSize.inpatients';

const renderPageSize = ({
  preferenceKey,
  defaultRowsPerPage,
  serverType = SERVER_TYPES.FACILITY,
}) => {
  const store = createStore(() => ({
    auth: { user: { id: 'user-1' }, facilityId: 'facility-1', server: { type: serverType } },
  }));
  const queryClient = createQueryClient();
  const wrapper = ({ children }) => (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ReduxProvider>
  );
  return renderHook(() => usePageSizePreference({ preferenceKey, defaultRowsPerPage }), {
    wrapper,
  });
};

describe('usePageSizePreference', () => {
  beforeEach(() => {
    mockApi.get.mockReset().mockResolvedValue({});
    mockApi.post.mockReset().mockResolvedValue({});
  });

  it('offers the standard sizes at the default size, without reading preferences, for a table with no key', () => {
    const { result } = renderPageSize({ defaultRowsPerPage: 25 });

    expect(result.current.rowsPerPageOptions).toEqual([10, 25, 50]);
    expect(result.current.rowsPerPage).toBe(25);
    expect(result.current.isPageSizeReady).toBe(true);
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('opens at 50 rows when the user has no saved size', async () => {
    const { result } = renderPageSize({ preferenceKey: PREFERENCE_KEY });

    expect(result.current.isPageSizeReady).toBe(false);
    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));
    expect(result.current.rowsPerPageOptions).toEqual([50, 100]);
    expect(result.current.rowsPerPage).toBe(50);
  });

  it('opens at the size the user saved', async () => {
    mockApi.get.mockResolvedValue({ [PREFERENCE_KEY]: 100 });
    const { result } = renderPageSize({ preferenceKey: PREFERENCE_KEY });

    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));
    expect(result.current.rowsPerPage).toBe(100);
  });

  it('opens at 50 rows when the saved size is not one the table offers', async () => {
    mockApi.get.mockResolvedValue({ [PREFERENCE_KEY]: 25 });
    const { result } = renderPageSize({ preferenceKey: PREFERENCE_KEY });

    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));
    expect(result.current.rowsPerPage).toBe(50);
  });

  it('opens at 50 rows when the preferences cannot be loaded', async () => {
    mockApi.get.mockRejectedValue(new Error('offline'));
    const { result } = renderPageSize({ preferenceKey: PREFERENCE_KEY });

    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));
    expect(result.current.rowsPerPage).toBe(50);
  });

  it('applies a picked size and saves it with no facility', async () => {
    const { result } = renderPageSize({ preferenceKey: PREFERENCE_KEY });
    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));

    act(() => result.current.onChangeRowsPerPage(100));

    expect(result.current.rowsPerPage).toBe(100);
    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith('user/userPreferences', {
        key: PREFERENCE_KEY,
        value: 100,
      }),
    );
  });

  it('keeps a picked size when saving it fails', async () => {
    mockApi.post.mockRejectedValue(new Error('offline'));
    const { result } = renderPageSize({ preferenceKey: PREFERENCE_KEY });
    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));

    act(() => result.current.onChangeRowsPerPage(100));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    expect(result.current.rowsPerPage).toBe(100);
  });

  it('reads and saves the admin panel preferences on the central server', async () => {
    mockApi.get.mockResolvedValue({ [PREFERENCE_KEY]: 100 });
    const { result } = renderPageSize({
      preferenceKey: PREFERENCE_KEY,
      serverType: SERVER_TYPES.CENTRAL,
    });

    await waitFor(() => expect(result.current.rowsPerPage).toBe(100));
    expect(mockApi.get).toHaveBeenCalledWith('admin/user/userPreferences');

    act(() => result.current.onChangeRowsPerPage(50));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith('admin/user/userPreferences', {
        key: PREFERENCE_KEY,
        value: 50,
      }),
    );
  });
});
