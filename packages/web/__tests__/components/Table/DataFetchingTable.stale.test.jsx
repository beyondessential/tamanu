/*
 * Regression test for DataFetchingTable's out-of-order response guard.
 *
 * Each fetch is tagged with an incrementing id. If a newer fetch has started by
 * the time an earlier one resolves, the earlier (stale) response must be
 * discarded so it cannot overwrite the current results. Previously a slow
 * earlier request (e.g. search "smi") could resolve after a newer one
 * ("smith") and clobber the correct rows.
 */

import * as React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';

// Capture a resolver for every api.get call so responses can be resolved out of order.
// `useApi` must return a STABLE object: `api` is a dependency of the fetch effect, so a fresh
// object each render would re-trigger the fetch on every state change.
const { fetchResolvers, stableApi } = vi.hoisted(() => {
  const resolvers = [];
  return {
    fetchResolvers: resolvers,
    stableApi: { get: () => new Promise(resolve => resolvers.push(resolve)) },
  };
});
vi.mock('../../../app/api', async () => {
  const actual = await vi.importActual('../../../app/api');
  return {
    ...actual,
    useApi: () => stableApi,
  };
});

vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return {
    ...actual,
    useDateTime: () => ({
      getCurrentDateTime: () => '2023-06-12 10:00',
      getCurrentDate: () => '2023-06-12',
    }),
  };
});

// getSetting is used for the auto-refresh feature flag and per-field hidden flags; leaving
// everything unset keeps auto-refresh off and all columns visible.
vi.mock('../../../app/contexts/Settings', async () => {
  const actual = await vi.importActual('../../../app/contexts/Settings');
  return {
    ...actual,
    useSettings: () => ({ getSetting: () => undefined }),
  };
});

// eslint-disable-next-line import/first
import { DataFetchingTable } from '../../../app/components/Table/DataFetchingTable';

const columns = [{ key: 'name', title: 'Name' }];

const renderTable = fetchOptions =>
  renderElementWithTranslatedText(
    <DataFetchingTable endpoint="patient" columns={columns} fetchOptions={fetchOptions} />,
  );

describe('DataFetchingTable stale response handling', () => {
  beforeEach(() => {
    fetchResolvers.length = 0;
  });

  it('ignores an earlier response that resolves after a newer fetch', async () => {
    // Mount triggers the first fetch (search "smi").
    const { rerender } = renderTable({ search: 'smi' });

    // Change the search, triggering a second, newer fetch (search "smith").
    rerender(
      <DataFetchingTable endpoint="patient" columns={columns} fetchOptions={{ search: 'smith' }} />,
    );

    // Two fetches should be in flight.
    await waitFor(() => expect(fetchResolvers.length).toBe(2));
    const [resolveStale, resolveNewer] = fetchResolvers;

    // The newer request resolves first with the correct rows.
    await act(async () => {
      resolveNewer({ data: [{ id: 'newer', name: 'Smith Result' }], count: 1 });
    });

    expect(screen.queryByText('Smith Result')).not.toBeNull();

    // The older ("smi") request resolves later; its stale rows must be discarded.
    await act(async () => {
      resolveStale({ data: [{ id: 'stale', name: 'Smi Result' }], count: 1 });
    });

    expect(screen.queryByText('Smi Result')).toBeNull();
    expect(screen.queryByText('Smith Result')).not.toBeNull();
  });
});
