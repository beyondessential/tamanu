/*
 * A table with a remembered page size waits for the user's preferences, then loads its first page
 * once at the remembered size rather than loading at the default and reloading.
 */

import * as React from 'react';
import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';

const PREFERENCE_KEY = 'tablePageSize.inpatients';

// `useApi` must return a STABLE object: `api` is a dependency of the fetch effect.
const { stableApi } = vi.hoisted(() => ({
  stableApi: { get: vi.fn(async () => ({ data: [], count: 0 })) },
}));
vi.mock('../../../app/api/useApi', () => ({ useApi: () => stableApi }));

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

vi.mock('../../../app/contexts/Settings', async () => {
  const actual = await vi.importActual('../../../app/contexts/Settings');
  return {
    ...actual,
    useSettings: () => ({ getSetting: () => undefined }),
  };
});

import { DataFetchingTable } from '../../../app/components/Table/DataFetchingTable';
import { PageSizePreferencesContext } from '../../../app/contexts/PageSizePreferences';

const columns = [{ key: 'name', title: 'Name' }];

const getTableFetches = () =>
  stableApi.get.mock.calls.filter(([endpoint]) => endpoint === 'patient');

const RememberedTable = ({ preferences = {}, isLoaded = true }) => (
  <PageSizePreferencesContext.Provider value={{ preferences, isLoaded, savePreference: vi.fn() }}>
    <DataFetchingTable
      endpoint="patient"
      columns={columns}
      pageSizePreferenceKey={PREFERENCE_KEY}
    />
  </PageSizePreferencesContext.Provider>
);

describe('DataFetchingTable page size', () => {
  beforeEach(() => {
    stableApi.get.mockClear();
  });

  it('loads its first page once, at the remembered size', async () => {
    renderElementWithTranslatedText(<RememberedTable preferences={{ [PREFERENCE_KEY]: 100 }} />);

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    expect(getTableFetches()[0][1]).toMatchObject({ page: 0, rowsPerPage: 100 });
  });

  it('waits for the preferences before loading its first page', async () => {
    const { rerender } = renderElementWithTranslatedText(<RememberedTable isLoaded={false} />);
    expect(getTableFetches()).toHaveLength(0);

    rerender(<RememberedTable preferences={{ [PREFERENCE_KEY]: 100 }} />);

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    expect(getTableFetches()[0][1]).toMatchObject({ rowsPerPage: 100 });
  });

  it('loads its first page at 50 rows when no size is remembered', async () => {
    renderElementWithTranslatedText(<RememberedTable />);

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    expect(getTableFetches()[0][1]).toMatchObject({ rowsPerPage: 50 });
  });

  it('loads at the standard default, without a preferences provider, when it has no key', async () => {
    renderElementWithTranslatedText(<DataFetchingTable endpoint="patient" columns={columns} />);

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    expect(getTableFetches()[0][1]).toMatchObject({ rowsPerPage: 10 });
  });
});
