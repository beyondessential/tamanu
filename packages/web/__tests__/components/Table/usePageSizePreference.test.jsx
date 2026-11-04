import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { AuthContext } from '@tamanu/ui-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '../../helpers';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../../../app/api/useApi', () => ({ useApi: () => mockApi }));

import { usePageSizePreference } from '../../../app/components/Table/usePageSizePreference';
import {
  AdminPageSizePreferencesProvider,
  FacilityPageSizePreferencesProvider,
  PageSizePreferencesContext,
} from '../../../app/contexts/PageSizePreferences';

const PREFERENCE_KEY = 'tablePageSize.inpatients';

const loadedPreferences = (preferences = {}) => ({
  preferences,
  isLoaded: true,
  savePreference: vi.fn(),
});

const renderWithPreferences = ({ preferenceKey, defaultRowsPerPage, pageSizePreferences }) =>
  renderHook(() => usePageSizePreference({ preferenceKey, defaultRowsPerPage }), {
    wrapper: ({ children }) => (
      <PageSizePreferencesContext.Provider value={pageSizePreferences}>
        {children}
      </PageSizePreferencesContext.Provider>
    ),
  });

describe('usePageSizePreference', () => {
  it('offers the standard sizes at the default size for a table with no key, without a provider', () => {
    const { result } = renderHook(() => usePageSizePreference({ defaultRowsPerPage: 25 }));

    expect(result.current.rowsPerPageOptions).toEqual([10, 25, 50]);
    expect(result.current.rowsPerPage).toBe(25);
    expect(result.current.isPageSizeReady).toBe(true);
  });

  it('opens at 50 rows when the user has no saved size', () => {
    const { result } = renderWithPreferences({
      preferenceKey: PREFERENCE_KEY,
      pageSizePreferences: loadedPreferences(),
    });

    expect(result.current.rowsPerPageOptions).toEqual([50, 100]);
    expect(result.current.rowsPerPage).toBe(50);
    expect(result.current.isPageSizeReady).toBe(true);
  });

  it('opens at the size the user saved', () => {
    const { result } = renderWithPreferences({
      preferenceKey: PREFERENCE_KEY,
      pageSizePreferences: loadedPreferences({ [PREFERENCE_KEY]: 100 }),
    });

    expect(result.current.rowsPerPage).toBe(100);
  });

  it('opens at 50 rows when the saved size is not one the table offers', () => {
    const { result } = renderWithPreferences({
      preferenceKey: PREFERENCE_KEY,
      pageSizePreferences: loadedPreferences({ [PREFERENCE_KEY]: 25 }),
    });

    expect(result.current.rowsPerPage).toBe(50);
  });

  it('is not ready until the preferences have loaded', () => {
    const { result } = renderWithPreferences({
      preferenceKey: PREFERENCE_KEY,
      pageSizePreferences: { ...loadedPreferences(), isLoaded: false },
    });

    expect(result.current.isPageSizeReady).toBe(false);
  });

  it('applies a picked size straight away and saves it', () => {
    const pageSizePreferences = loadedPreferences();
    const { result } = renderWithPreferences({
      preferenceKey: PREFERENCE_KEY,
      pageSizePreferences,
    });

    act(() => result.current.onChangeRowsPerPage(100));

    expect(result.current.rowsPerPage).toBe(100);
    expect(pageSizePreferences.savePreference).toHaveBeenCalledWith({
      key: PREFERENCE_KEY,
      value: 100,
    });
  });

  it('throws for a table with a key outside a provider', () => {
    // React and jsdom both report the error as well as throwing it
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const suppressErrorReport = event => event.preventDefault();
    window.addEventListener('error', suppressErrorReport);

    expect(() =>
      renderHook(() => usePageSizePreference({ preferenceKey: PREFERENCE_KEY })),
    ).toThrow(PREFERENCE_KEY);

    window.removeEventListener('error', suppressErrorReport);
    console.error.mockRestore();
  });
});

describe('page size preferences providers', () => {
  beforeEach(() => {
    mockApi.get.mockReset().mockResolvedValue({});
    mockApi.post.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    onlineManager.setOnline(undefined);
  });

  const renderWithProvider = (Provider = FacilityPageSizePreferencesProvider) => {
    const queryClient = createQueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ currentUser: { id: 'user-1' }, facilityId: 'facility-1' }}>
          <Provider>{children}</Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
    return renderHook(() => usePageSizePreference({ preferenceKey: PREFERENCE_KEY }), {
      wrapper,
    });
  };

  it('reads the clinical app preferences from the facility server, and saves with no facility', async () => {
    mockApi.get.mockResolvedValue({ [PREFERENCE_KEY]: 100 });
    const { result } = renderWithProvider();

    expect(result.current.isPageSizeReady).toBe(false);
    await waitFor(() => expect(result.current.rowsPerPage).toBe(100));
    expect(mockApi.get).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'user/userPreferences/:facilityId' }),
    );

    act(() => result.current.onChangeRowsPerPage(50));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith('user/userPreferences', {
        key: PREFERENCE_KEY,
        value: 50,
      }),
    );
    expect(mockApi.post.mock.calls[0][1].facilityId).toBeUndefined();
  });

  it('reloads the preferences after saving, so they match what the server holds', async () => {
    const { result } = renderWithProvider();
    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));
    expect(mockApi.get).toHaveBeenCalledTimes(1);

    act(() => result.current.onChangeRowsPerPage(100));

    await waitFor(() => expect(mockApi.get).toHaveBeenCalledTimes(2));
    expect(result.current.rowsPerPage).toBe(100);
  });

  it('reads and saves the admin panel preferences on the central server', async () => {
    mockApi.get.mockResolvedValue({ [PREFERENCE_KEY]: 100 });
    const { result } = renderWithProvider(AdminPageSizePreferencesProvider);

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

  it('opens at 50 rows when the preferences cannot be loaded', async () => {
    mockApi.get.mockRejectedValue(new Error('offline'));
    const { result } = renderWithProvider();

    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));
    expect(result.current.rowsPerPage).toBe(50);
  });

  it('opens at 50 rows without waiting while the browser reports itself offline', () => {
    onlineManager.setOnline(false);
    const { result } = renderWithProvider();

    expect(result.current.isPageSizeReady).toBe(true);
    expect(result.current.rowsPerPage).toBe(50);
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('sends each save only after the one before it has finished', async () => {
    const { result } = renderWithProvider();
    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));
    let finishFirstSave;
    mockApi.post.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishFirstSave = () => resolve({});
        }),
    );

    act(() => result.current.onChangeRowsPerPage(100));
    act(() => result.current.onChangeRowsPerPage(50));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(mockApi.post.mock.calls[0][1]).toMatchObject({ value: 100 });
    expect(result.current.rowsPerPage).toBe(50);

    finishFirstSave();

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(2));
    expect(mockApi.post.mock.calls[1][1]).toMatchObject({ value: 50 });
  });

  it('still sends a save when the one before it failed', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderWithProvider();
    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));

    act(() => result.current.onChangeRowsPerPage(100));
    act(() => result.current.onChangeRowsPerPage(50));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(2));
    expect(mockApi.post.mock.calls[1][1]).toMatchObject({ value: 50 });
  });

  it('keeps a picked size when saving it fails', async () => {
    mockApi.post.mockRejectedValue(new Error('offline'));
    const { result } = renderWithProvider();
    await waitFor(() => expect(result.current.isPageSizeReady).toBe(true));

    act(() => result.current.onChangeRowsPerPage(100));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    expect(result.current.rowsPerPage).toBe(100);
  });
});
