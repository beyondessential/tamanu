import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
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
  CENTRAL: 'These settings will only apply to the central server',
  GLOBAL: 'These settings will apply to all servers/devices',
  FACILITY: `These settings will only apply to the facility/devices linked to it`,
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
    value: null, // null is equivalent to all faciliites in backend logic
    tag: {
      label: 'Global',
      background: Colors.orange,
      color: Colors.white,
    },
  },
];

const getHelperText = selectedFacility => {
  switch (selectedFacility) {
    case SETTINGS_SCOPES.CENTRAL:
      return SCOPE_HELPERTEXT.CENTRAL;
    case null:
      return SCOPE_HELPERTEXT.GLOBAL;
    default:
      return SCOPE_HELPERTEXT.FACILITY;
  }
};

export const ScopeSelector = React.memo(({ selectedFacility, onChangeFacility }) => {
  const api = useApi();
  const [facilityOptions, setFacilityOptions] = useState([]);

  useEffect(() => {
    const fetchFacilities = async () => {
      const facilitiesArray = await api.get('admin/facilities');
      setFacilityOptions(
        facilitiesArray.map(facility => ({
          label: facility.name,
          value: facility.id,
          tag: {
            label: 'Facility',
            background: Colors.blue,
            color: Colors.white,
          },
        })),
      );
    };
    fetchFacilities();
  }, [api]);

  const helperText = getHelperText(selectedFacility);

  return (
    <ScopeSelectorInput
      value={selectedFacility}
      onChange={onChangeFacility}
      options={BASIC_OPTIONS.concat(facilityOptions)}
      label="Select a facility/server to view and edit its settings"
      isClearable={false}
      helperText={helperText}
    />
  );
});
