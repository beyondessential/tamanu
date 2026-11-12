import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@tamanu/ui-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient, renderElementWithTranslatedText } from '../../helpers';

const PAGE_SIZE_KEY = 'tablePageSize.inpatients';
const SORT_KEY = 'tableSort.inpatients';

const { stableApi, autoRefresh } = vi.hoisted(() => ({
  stableApi: { get: vi.fn(), post: vi.fn() },
  autoRefresh: { setting: undefined },
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
    useSettings: () => ({
      getSetting: key => (key === 'features.tableAutoRefresh' ? autoRefresh.setting : undefined),
    }),
  };
});

vi.mock('../../../app/components/Table/TableRefreshButton', () => ({
  TableRefreshButton: ({ refreshTable }) => (
    <button type="button" onClick={refreshTable}>
      Refresh
    </button>
  ),
}));

import { DataFetchingTable } from '../../../app/components/Table/DataFetchingTable';
import { FacilityPageSizePreferencesProvider } from '../../../app/contexts/PageSizePreferences';

const columns = [
  { key: 'name', title: 'Name' },
  { key: 'notes', title: 'Notes', sortable: false },
];

const getTableFetches = () =>
  stableApi.get.mock.calls.filter(([endpoint]) => endpoint === 'patient');

const respondWithPreferences = preferences =>
  stableApi.get.mockImplementation(async endpoint =>
    endpoint === 'patient' ? { data: [], count: 0 } : preferences,
  );

const ToggleableTable = ({ pageSizePreferenceKey }) => {
  const [isShown, setIsShown] = React.useState(true);
  return (
    <>
      <button type="button" onClick={() => setIsShown(shown => !shown)}>
        Toggle table
      </button>
      {isShown && (
        <DataFetchingTable
          endpoint="patient"
          columns={columns}
          pageSizePreferenceKey={pageSizePreferenceKey}
          initialSort={{ orderBy: 'name', order: 'asc' }}
          autoRefresh
        />
      )}
    </>
  );
};

const renderTable = ({ pageSizePreferenceKey = PAGE_SIZE_KEY } = {}) =>
  renderElementWithTranslatedText(
    <QueryClientProvider client={createQueryClient()}>
      <AuthContext.Provider value={{ currentUser: { id: 'user-1' }, facilityId: 'facility-1' }}>
        <FacilityPageSizePreferencesProvider>
          <ToggleableTable pageSizePreferenceKey={pageSizePreferenceKey} />
        </FacilityPageSizePreferencesProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );

const showTableAgain = async () => {
  const fetchCount = getTableFetches().length;
  fireEvent.click(screen.getByText('Toggle table'));
  fireEvent.click(screen.getByText('Toggle table'));
  await waitFor(() => expect(getTableFetches()).toHaveLength(fetchCount + 1));
  return getTableFetches().at(-1)[1];
};

const settle = () =>
  act(
    () =>
      new Promise(resolve => {
        setTimeout(resolve, 50);
      }),
  );

describe('DataFetchingTable sort', () => {
  beforeEach(() => {
    stableApi.get.mockReset();
    stableApi.post.mockReset().mockResolvedValue({});
    autoRefresh.setting = undefined;
    respondWithPreferences({});
  });

  it('loads its first page once, in the remembered sort', async () => {
    respondWithPreferences({ [SORT_KEY]: { orderBy: 'name', order: 'desc' } });
    renderTable();

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    await settle();
    expect(getTableFetches()).toHaveLength(1);
    expect(getTableFetches()[0][1]).toMatchObject({ orderBy: 'name', order: 'desc' });
  });

  it.each([
    ['cannot be sorted', 'notes'],
    ['is not on the table', 'removedColumn'],
  ])('opens at its initial sort when the remembered column %s', async (_, orderBy) => {
    respondWithPreferences({ [SORT_KEY]: { orderBy, order: 'desc' } });
    renderTable();

    await waitFor(() => expect(getTableFetches()).toHaveLength(1));
    expect(getTableFetches()[0][1]).toMatchObject({ orderBy: 'name', order: 'asc' });
  });

  it('saves a sort the user applies for the facility logged in to', async () => {
    renderTable();
    await waitFor(() => expect(getTableFetches()).toHaveLength(1));

    fireEvent.click(screen.getByText('Name'));

    await waitFor(() =>
      expect(stableApi.post).toHaveBeenCalledWith('user/userPreferences', {
        facilityId: 'facility-1',
        key: SORT_KEY,
        value: { orderBy: 'name', order: 'desc' },
      }),
    );
    expect(getTableFetches().at(-1)[1]).toMatchObject({ orderBy: 'name', order: 'desc' });
  });

  it('keeps an applied sort when shown again before saving it has finished', async () => {
    stableApi.post.mockReturnValue(new Promise(() => {}));
    renderTable();
    await waitFor(() => expect(getTableFetches()).toHaveLength(1));

    fireEvent.click(screen.getByText('Name'));

    expect(await showTableAgain()).toMatchObject({ orderBy: 'name', order: 'desc' });
  });

  it('saves the initial sort when the table is refreshed', async () => {
    autoRefresh.setting = { enabled: true, interval: 3600 };
    respondWithPreferences({ [SORT_KEY]: { orderBy: 'name', order: 'desc' } });
    renderTable();
    await waitFor(() => expect(getTableFetches()).toHaveLength(1));

    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() =>
      expect(stableApi.post).toHaveBeenCalledWith('user/userPreferences', {
        facilityId: 'facility-1',
        key: SORT_KEY,
        value: { orderBy: 'name', order: 'asc' },
      }),
    );
  });

  it('keeps the sort only until shown again on a table that does not remember it', async () => {
    renderTable({ pageSizePreferenceKey: 'tablePageSize.immunisationRegister' });
    await waitFor(() => expect(getTableFetches()).toHaveLength(1));

    fireEvent.click(screen.getByText('Name'));
    await waitFor(() =>
      expect(getTableFetches().at(-1)[1]).toMatchObject({ orderBy: 'name', order: 'desc' }),
    );

    expect(await showTableAgain()).toMatchObject({ orderBy: 'name', order: 'asc' });
    expect(stableApi.post).not.toHaveBeenCalled();
  });
});
