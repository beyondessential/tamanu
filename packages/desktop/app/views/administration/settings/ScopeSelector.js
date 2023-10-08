import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useApi } from '../../../api';
import { Colors } from '../../../constants';
import { SelectInput } from '../../../components';

const ScopeSelectorInput = styled(SelectInput)`
  width: 500px;
  div:first-child {
    overflow: visible;
  }
`;

const SCOPE_HELPERTEXT = {
  [SETTINGS_SCOPES.CENTRAL]: 'These settings will only apply to the central server',
  [SETTINGS_SCOPES.GLOBAL]: 'These settings will apply to all servers/devices',
  [SETTINGS_SCOPES.FACILITY]: `These settings will only apply to the facility/devices linked to it`,
};

const BASIC_OPTIONS = [
  {
    label: 'Central Server',
    value: SETTINGS_SCOPES.CENTRAL,
    tag: {
      label: 'Central',
      background: Colors.pink,
      color: Colors.white,
    },
  },
  {
    label: 'Global Settings',
    value: SETTINGS_SCOPES.GLOBAL,
    tag: {
      label: 'Global',
      background: Colors.orange,
      color: Colors.white,
    },
  },
];

const SCOPE_CODE_DELIMITER = '#!@';

export const parseScopeCode = scopeCode => {
  const scope = scopeCode?.split(SCOPE_CODE_DELIMITER)[0];
  const facilityId = scopeCode?.split(SCOPE_CODE_DELIMITER)[1] || null;
  return { scope, facilityId };
};

export const ScopeSelector = React.memo(({ selectedScopeCode, onChangeScopeCode }) => {
  const api = useApi();

  const { data: facilitiesArray = [], error } = useQuery(['facilitiesList'], () =>
    api.get('admin/facilities'),
  );

  const facilityOptions = facilitiesArray.map(facility => ({
    label: facility.name,
    value: SETTINGS_SCOPES.FACILITY + SCOPE_CODE_DELIMITER + facility.id,
    tag: {
      label: 'Facility',
      background: Colors.blue,
      color: Colors.white,
    },
  }));

  const { scope } = parseScopeCode(selectedScopeCode);
  const helperText = SCOPE_HELPERTEXT[scope];

  return (
    <ScopeSelectorInput
      value={selectedScopeCode}
      onChange={onChangeScopeCode}
      options={BASIC_OPTIONS.concat(facilityOptions)}
      label="Select a facility/server to view and edit its settings"
      isClearable={false}
      error={!!error}
      helperText={helperText}
    />
  );
});
