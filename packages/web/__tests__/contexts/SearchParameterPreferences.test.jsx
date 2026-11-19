import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IMAGING_TABLE_VERSIONS } from '@tamanu/constants/imaging';

const preferences = vi.hoisted(() => ({ data: {}, mutate: vi.fn() }));

vi.mock('../../app/api/queries', () => ({
  useUserPreferencesQuery: () => ({ data: preferences.data }),
}));
vi.mock('../../app/api/mutations', () => ({
  useUserPreferencesMutation: () => ({ mutate: preferences.mutate }),
}));
vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' }, facilityId: 'facility-1' }),
}));
vi.mock('../../app/api', () => ({ useApi: () => ({}) }));

import {
  LabRequestProvider,
  LabRequestSearchParamKeys,
  useLabRequest,
} from '../../app/contexts/LabRequest';
import {
  ImagingRequestsProvider,
  useImagingRequestsQuery,
} from '../../app/contexts/ImagingRequests';
import { MedicationsProvider, useMedicationsContext } from '../../app/contexts/Medications';
import { MEDICATIONS_SEARCH_KEYS } from '../../app/constants/medication';

const PROVIDERS = [
  {
    name: 'lab requests',
    preferenceKey: 'labRequestSearchParameters',
    Provider: LabRequestProvider,
    tables: [LabRequestSearchParamKeys.All, LabRequestSearchParamKeys.Finalised],
    useSearch: useLabRequest,
  },
  {
    name: 'imaging requests',
    preferenceKey: 'imagingRequestSearchParameters',
    Provider: ImagingRequestsProvider,
    tables: [IMAGING_TABLE_VERSIONS.ACTIVE.memoryKey, IMAGING_TABLE_VERSIONS.COMPLETED.memoryKey],
    useSearch: useImagingRequestsQuery,
  },
  {
    name: 'medications',
    preferenceKey: 'medicationSearchParameters',
    Provider: MedicationsProvider,
    tables: [MEDICATIONS_SEARCH_KEYS.ACTIVE, MEDICATIONS_SEARCH_KEYS.DISPENSED],
    useSearch: useMedicationsContext,
  },
];

describe.each(PROVIDERS)(
  '$name search parameters',
  ({ preferenceKey, Provider, tables, useSearch }) => {
    const [table, otherTable] = tables;

    const SearchConsumer = () => {
      const { searchParameters, setSearchParameters } = useSearch(table);
      return (
        <>
          <div data-testid="parameters">{JSON.stringify(searchParameters)}</div>
          <button type="button" onClick={() => setSearchParameters({ locationGroupId: 'area-1' })}>
            search
          </button>
        </>
      );
    };

    beforeEach(() => {
      preferences.data = {};
      preferences.mutate.mockClear();
    });

    it('opens with the saved filters for its table', () => {
      preferences.data = { [preferenceKey]: { [table]: { locationGroupId: 'area-2' } } };
      render(
        <Provider>
          <SearchConsumer />
        </Provider>,
      );

      expect(screen.getByTestId('parameters').textContent).toBe(
        JSON.stringify({ locationGroupId: 'area-2' }),
      );
    });

    it('saves under its own preference key, keeping its other tables', async () => {
      preferences.data = { [preferenceKey]: { [otherTable]: { locationGroupId: 'area-3' } } };
      render(
        <Provider>
          <SearchConsumer />
        </Provider>,
      );

      await userEvent.click(screen.getByRole('button', { name: 'search' }));

      expect(preferences.mutate).toHaveBeenLastCalledWith({
        key: preferenceKey,
        value: expect.objectContaining({
          [table]: { locationGroupId: 'area-1' },
          [otherTable]: { locationGroupId: 'area-3' },
        }),
      });
    });
  },
);
