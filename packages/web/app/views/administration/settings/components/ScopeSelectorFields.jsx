import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useApi } from '../../../../api';
import { DynamicSelectField } from '../../../../components';
import { SelectInput } from '@tamanu/ui-components';
import { TranslatedText } from '../../../../components/Translation';

const ScopeSelectInput = styled(SelectInput)`
  width: 300px;
`;

const ScopeDynamicSelectInput = styled(DynamicSelectField)`
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

export const ScopeSelectorFields = React.memo(
  ({ scope, onScopeChange, facilityId, onFacilityChange }) => {
    const api = useApi();
    const { data: facilitiesArray = [], error } = useQuery(
      ['facilitiesList'],
      () => api.get('admin/facilities'),
      {
        enabled: scope === SETTINGS_SCOPES.FACILITY,
      },
    );

    const facilityOptions = facilitiesArray.map((facility) => ({
      label: facility.name,
      value: facility.id,
    }));

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
          error={!!error}
          data-testid="scopeselectinput-zxel"
        />
        {scope === SETTINGS_SCOPES.FACILITY && (
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
      </>
    );
  },
);
