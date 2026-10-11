import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useApi } from '../../../../api';
import { SelectInput } from '../../../../components';
import { TranslatedText } from '../../../../components/Translation';

const ScopeSelectInput = styled(SelectInput)`
  width: 300px;
`;

const FacilitySelectInput = styled(SelectInput)`
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
    // Shows the picked value while the unsaved-changes warning is open; the real one after
    const [pendingScope, setPendingScope] = useState(null);
    const [pendingFacilityId, setPendingFacilityId] = useState(null);
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
          value={pendingScope ?? scope}
          onChange={async event => {
            setPendingScope(event.target.value);
            await onScopeChange(event);
            setPendingScope(null);
          }}
          isClearable={false}
          error={!!error}
          data-testid="scopeselectinput-zxel"
        />
        {scope === SETTINGS_SCOPES.FACILITY && (
          <FacilitySelectInput
            name="facilityId"
            options={facilityOptions}
            label={
              <TranslatedText
                stringId="general.facility.label"
                fallback="Facility"
                data-testid="translatedtext-yz34"
              />
            }
            value={pendingFacilityId ?? facilityId}
            onChange={async event => {
              setPendingFacilityId(event.target.value);
              await onFacilityChange(event);
              setPendingFacilityId(null);
            }}
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
