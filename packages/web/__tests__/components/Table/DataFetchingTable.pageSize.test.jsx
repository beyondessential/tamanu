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
const { stableApi, savedPreferences } = vi.hoisted(() => {
  const preferences = {};
  return {
    savedPreferences: preferences,
    stableApi: {
      get: vi.fn(async endpoint =>
        endpoint === 'patient' ? { data: [], count: 0 } : { ...preferences },
      ),
    },
  };
});
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

const columns = [{ key: 'name', title: 'Name' }];

const getTableFetches = () =>
  stableApi.get.mock.calls.filter(([endpoint]) => endpoint === 'patient');

describe('DataFetchingTable page size', () => {
  beforeEach(() => {
    stableApi.get.mockClear();
    delete savedPreferences[PREFERENCE_KEY];
  });

  it('loads its first page once, at the remembered size', async () => {
    savedPreferences[PREFERENCE_KEY] = 100;

    renderElementWithTranslatedText(
      <DataFetchingTable
        endpoint="patient"
        columns={columns}
        pageSizePreferenceKey={PREFERENCE_KEY}
      />,
    );

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    expect(getTableFetches()[0][1]).toMatchObject({ page: 0, rowsPerPage: 100 });
  });

  it('loads its first page at 50 rows when no size is remembered', async () => {
    renderElementWithTranslatedText(
      <DataFetchingTable
        endpoint="patient"
        columns={columns}
        pageSizePreferenceKey={PREFERENCE_KEY}
      />,
    );

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    expect(getTableFetches()[0][1]).toMatchObject({ rowsPerPage: 50 });
  });

  it('loads at the standard default without reading preferences when it has no key', async () => {
    renderElementWithTranslatedText(<DataFetchingTable endpoint="patient" columns={columns} />);

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    expect(getTableFetches()[0][1]).toMatchObject({ rowsPerPage: 10 });
    expect(stableApi.get).toHaveBeenCalledTimes(1);
  });
});
