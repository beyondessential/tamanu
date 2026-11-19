import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_TABLE_STATUS_GROUPINGS } from '@tamanu/constants';
import { SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../helpers';
import { LabRequestsSearchBar } from '../../app/components/SearchBar/LabRequestsSearchBar';

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true } }),
}));

vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: () => undefined }),
}));

// A status already filtered on opens the advanced panel, where the finalised listing keeps its
// status field.
vi.mock('../../app/contexts/LabRequest', async importOriginal => ({
  ...(await importOriginal()),
  useLabRequest: () => ({
    searchParameters: { status: ['published'] },
    setSearchParameters: () => {},
  }),
}));

vi.mock('../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useSuggester: () => ({
    fetchSuggestions: async () => [],
    fetchCurrentOption: async () => null,
  }),
}));

const STATUS_OPTIONS_PROBE = 'status-options-probe';

// Strip the fields this test doesn't exercise, and stand in for the react-select multiselect to
// report the options the search bar hands its suggester.
vi.mock('../../app/components/Field', async importOriginal => ({
  ...(await importOriginal()),
  AutocompleteField: () => null,
  CheckField: () => null,
  DateField: () => null,
  SearchField: () => null,
  SuggesterSelectField: () => null,
  MultiAutocompleteField: ({ suggester }) => {
    const [optionValues, setOptionValues] = React.useState(null);
    React.useEffect(() => {
      suggester.fetchSuggestions('').then(options => setOptionValues(options.map(o => o.value)));
    }, [suggester]);
    return <div data-testid={STATUS_OPTIONS_PROBE}>{optionValues?.join(',')}</div>;
  },
}));

const renderSearchBar = statuses =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <LabRequestsSearchBar statuses={statuses} />
    </SettingsContext.Provider>,
  );

const getStatusOptions = async () => {
  await waitFor(() => {
    expect(screen.getByTestId(STATUS_OPTIONS_PROBE).textContent).not.toBe('');
  });
  return screen.getByTestId(STATUS_OPTIONS_PROBE).textContent.split(',');
};

describe('LabRequestsSearchBar status filter', () => {
  it('offers only active statuses on the active requests listing', async () => {
    renderSearchBar(LAB_REQUEST_TABLE_STATUS_GROUPINGS.ACTIVE);

    const options = await getStatusOptions();
    expect(options).not.toContain(LAB_REQUEST_STATUSES.REJECTED);
    expect([...options].sort()).toEqual([...LAB_REQUEST_TABLE_STATUS_GROUPINGS.ACTIVE].sort());
  });

  it('still offers rejected on the finalised requests listing', async () => {
    renderSearchBar(LAB_REQUEST_TABLE_STATUS_GROUPINGS.COMPLETED);

    const options = await getStatusOptions();
    expect(options).toContain(LAB_REQUEST_STATUSES.REJECTED);
    expect([...options].sort()).toEqual([...LAB_REQUEST_TABLE_STATUS_GROUPINGS.COMPLETED].sort());
  });
});
