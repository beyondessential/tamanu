import * as React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSET_NAMES, BLOB_AVAILABILITY_STATES } from '@tamanu/constants';

import { createQueryClient } from '../../helpers';

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('../../../app/api/useApi', () => ({ useApi: () => ({ get: apiGet }) }));
vi.mock('../../../app/contexts/Auth', () => ({ useAuth: () => ({ facilityId: 'facility-1' }) }));

import { useAssetQuery } from '../../../app/api/queries/useAssetQuery';

const ASSET_NAME = ASSET_NAMES.VACCINATION_CERTIFICATE_FOOTER;
const FALLBACK_NAME = ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG;

// Express serialises the row's image buffer this way, so it is what the browser
// actually receives.
const uploaded = (...bytes) => ({ type: 'image/png', data: { type: 'Buffer', data: bytes } });
const neverUploaded = () => ({});
const contentPending = () => ({
  type: 'image/png',
  data: null,
  availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH,
});

const respondWith = (byName) =>
  apiGet.mockImplementation(async (endpoint) => byName[endpoint.replace('asset/', '')]);

const requestedAssets = () => apiGet.mock.calls.map(([endpoint]) => endpoint);

const renderAssetQuery = () => {
  const queryClient = createQueryClient();
  return renderHook(() => useAssetQuery(ASSET_NAME), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

const settled = async (result) => {
  await waitFor(() => expect(result.current.isFetching).toBe(false));
};

describe('useAssetQuery', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  // spec: ASSET
  // A fallback stands in only for an asset that was never uploaded, so a
  // pending asset must never be substituted with a different image.
  it('never asks for the fallback of a content-pending asset', async () => {
    respondWith({ [ASSET_NAME]: contentPending(), [FALLBACK_NAME]: uploaded(9, 9, 9) });

    const { result } = renderAssetQuery();
    await waitFor(() => expect(result.current.isPending).toBe(true));
    await settled(result);

    expect(requestedAssets()).toEqual([`asset/${ASSET_NAME}`]);
    expect(result.current.data).toBeNull();
  });

  it('substitutes the fallback for an asset that was never uploaded', async () => {
    respondWith({ [ASSET_NAME]: neverUploaded(), [FALLBACK_NAME]: uploaded(1, 2, 3) });

    const { result } = renderAssetQuery();
    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(requestedAssets()).toContain(`asset/${FALLBACK_NAME}`);
    expect(result.current.data).toBe('data:image/png;base64,AQID');
    expect(result.current.isPending).toBe(false);
  });

  it('shows the asset itself without reaching for the fallback', async () => {
    respondWith({ [ASSET_NAME]: uploaded(4, 5, 6), [FALLBACK_NAME]: uploaded(9, 9, 9) });

    const { result } = renderAssetQuery();
    await waitFor(() => expect(result.current.data).not.toBeNull());
    await settled(result);

    expect(requestedAssets()).toEqual([`asset/${ASSET_NAME}`]);
    expect(result.current.data).toBe('data:image/png;base64,BAUG');
  });
});
