import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useApi } from '../../../api';
import { SelectInput } from '../../../components';

const ScopeSelectorInput = styled(SelectInput)`
  width: 300px;
  margin-right: 5px;
  div:first-child {
    overflow: visible;
  }
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

export const ScopeSelector = React.memo(
  ({ selectedScope, onChangeScope, selectedFacility, onChangeFacility }) => {
    const api = useApi();

    const { data: facilitiesArray = [], error } = useQuery(['facilitiesList'], () =>
      api.get('admin/facilities'),
    );

    const facilityOptions = facilitiesArray.map(facility => ({
      label: facility.name,
      value: facility.id,
    }));

    return (
      <>
        <ScopeSelectorInput
          value={selectedScope}
          onChange={onChangeScope}
          options={SCOPE_OPTIONS}
          label="Scope"
          isClearable={false}
          error={!!error}
        />
        {selectedScope === SETTINGS_SCOPES.FACILITY && (
          <ScopeSelectorInput
            value={selectedFacility}
            onChange={onChangeFacility}
            options={facilityOptions}
            label="Facility"
            isClearable={false}
            error={!!error}
          />
        )}
      </>
    );
  },
);
