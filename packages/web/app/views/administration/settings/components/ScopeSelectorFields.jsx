import React from 'react';
import styled from 'styled-components';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useSuggester } from '../../../../api';
import { SelectInput, AutocompleteInput } from '../../../../components';
import { TranslatedText } from '../../../../components/Translation';

const ScopeSelectInput = styled(SelectInput)`
  width: 300px;
`;

const FacilityAutoCompleteInput = styled(AutocompleteInput)`
  width: 300px;
  margin-top: 0.5rem;
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

export const ScopeSelectorFields = React.memo(({ scope, onScopeChange, onFacilityChange }) => {
  const facilitySuggester = useSuggester('facility');

  return (
    <>
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
        data-testid="scopeselectinput-zxel"
      />
      {scope === SETTINGS_SCOPES.FACILITY && (
        <FacilityAutoCompleteInput
          name="facilityId"
          suggester={facilitySuggester}
          label={
            <TranslatedText
              stringId="general.facility.label"
              fallback="Facility"
              data-testid="translatedtext-yz34"
            />
          }
          onChange={onFacilityChange}
          required
          isClearable={false}
          data-testid="scopedynamicselectinput-z7sz"
        />
      )}
    </>
  );
});
