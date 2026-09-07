import * as React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSET_NAMES, BLOB_AVAILABILITY_STATES } from '@tamanu/constants';

import { createQueryClient } from '../helpers';

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('../../app/api/useApi', () => ({ useApi: () => ({ get: apiGet }) }));
vi.mock('../../app/contexts/Auth', () => ({ useAuth: () => ({ facilityId: 'facility-1' }) }));
vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: () => ({ title: 'Ministry of Health', subTitle: 'Tamanu' }) }),
}));
vi.mock('react-redux', () => ({ useSelector: () => ({ displayName: 'Test Clinician' }) }));

import { useCertificate } from '../../app/utils/useCertificate';

// Express serialises the row's image buffer this way, so it is what the browser
// actually receives.
const uploaded = (...bytes) => ({ type: 'image/png', data: { type: 'Buffer', data: bytes } });
const neverUploaded = () => ({});
const contentPending = () => ({
  type: 'image/png',
  data: null,
  availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH,
});

const respondWith = (byName, fallback) =>
  apiGet.mockImplementation(async (endpoint) => byName[endpoint.replace('asset/', '')] ?? fallback);

const renderCertificate = () => {
  const queryClient = createQueryClient();
  return renderHook(() => useCertificate(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

describe('useCertificate', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  // spec: ASSET
  // The document must not print without artwork it is meant to carry, so
  // consumers gating on isFetching hold it until the bytes arrive.
  it('stays not-ready while an asset is awaiting its content', async () => {
    respondWith({ [ASSET_NAMES.LETTERHEAD_LOGO]: contentPending() }, uploaded(1, 2, 3));

    const { result } = renderCertificate();
    await waitFor(() => expect(result.current.isPending).toBe(true));
    await waitFor(() => expect(result.current.data.watermark).not.toBeNull());

    expect(result.current.isFetching).toBe(true);
    expect(result.current.data.logo).toBeNull();
  });

  it('becomes ready once every asset has resolved', async () => {
    respondWith({}, uploaded(1, 2, 3));

    const { result } = renderCertificate();
    await waitFor(() => expect(result.current.isFetching).toBe(false));

    expect(result.current.isPending).toBe(false);
    expect(result.current.data.logo).toBe('data:image/png;base64,AQID');
  });

  // spec: ASSET
  // Artwork is an optional element, so a deployment that uploaded none still
  // prints; only a pending asset holds the document back.
  it('becomes ready when no asset was ever uploaded', async () => {
    respondWith({}, neverUploaded());

    const { result } = renderCertificate();
    await waitFor(() => expect(result.current.isFetching).toBe(false));

    expect(result.current.isPending).toBe(false);
    expect(result.current.data.logo).toBeNull();
  });
});
