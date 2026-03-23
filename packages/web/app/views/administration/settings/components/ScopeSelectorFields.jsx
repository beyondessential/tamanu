import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useApi } from '../../../../api';
import { DynamicSelectField, SelectInput } from '../../../../components';
import { TranslatedText } from '../../../../components/Translation';
import { SettingsSearchBar } from './SettingsSearchBar';
import { SettingsSearchResults } from './SettingsSearchResults';

const ScopeSelectInput = styled(SelectInput)`
  width: 300px;
`;

const ScopeDynamicSelectInput = styled(DynamicSelectField)`
  width: 300px;
  margin-top: 0.5rem;
`;

const ScopeAndSearchRow = styled.div`
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SCOPE_OPTIONS = [
  {
    label: 'Global (All Facilities/Servers)',
    value: SETTINGS_SCOPES.GLOBAL,
  },
  {
    label: 'Central (Sync server)',
    value: SETTINGS_SCOPES.CENTRAL,
  },
  {
    label: 'Facility (Single Facility)',
    value: SETTINGS_SCOPES.FACILITY,
  },
];

export const ScopeSelectorFields = React.memo(
  ({
    scope,
    onScopeChange,
    facilityId,
    onFacilityChange,
    isSearchActive,
    searchQuery,
    setSearchQuery,
    clearSearch,
    searchResults,
    onSelectSearchResult,
  }) => {
    const api = useApi();
    const { data: facilitiesArray = [], error } = useQuery(
      ['facilitiesList'],
      () => api.get('admin/facilities'),
      {
        enabled: scope === SETTINGS_SCOPES.FACILITY,
      },
    );

    const facilityOptions = facilitiesArray.map(facility => ({
      label: facility.name,
      value: facility.id,
    }));

    // The search bar is only shown when setSearchQuery is provided (i.e. on the Editor tab)
    const showSearch = Boolean(setSearchQuery);

    return (
      <>
        <ScopeAndSearchRow>
          <ScopeSelectInput
            name="scope"
            label={
              <TranslatedText
                stringId="admin.settings.scope.label"
                fallback="Scope"
                data-testid="translatedtext-8bro"
              />
            }
            options={SCOPE_OPTIONS}
            value={scope}
            onChange={onScopeChange}
            isClearable={false}
            disabled={isSearchActive}
            error={!!error}
            data-testid="scopeselectinput-zxel"
          />
          {showSearch && (
            <SettingsSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onClear={clearSearch}
              data-testid="settings-search-bar"
            />
          )}
        </ScopeAndSearchRow>
        {scope === SETTINGS_SCOPES.FACILITY && !isSearchActive && (
          <ScopeDynamicSelectInput
            name="facilityId"
            options={facilityOptions}
            label={
              <TranslatedText
                stringId="general.facility.label"
                fallback="Facility"
                data-testid="translatedtext-yz34"
              />
            }
            value={facilityId}
            onChange={onFacilityChange}
            required
            isClearable={false}
            error={!!error}
            data-testid="scopedynamicselectinput-z7sz"
          />
        )}
        {isSearchActive && (
          <SettingsSearchResults
            searchResults={searchResults}
            onSelectResult={onSelectSearchResult}
            data-testid="settings-search-results"
          />
        )}
      </>
    );
  },
);
