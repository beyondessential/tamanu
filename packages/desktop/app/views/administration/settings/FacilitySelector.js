import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SETTINGS_SCOPES } from '@tamanu/shared/constants';

import { useApi } from '../../../api';
import { Colors } from '../../../constants';
import { SelectInput } from '../../../components';

const FacilitySelectorInput = styled(SelectInput)`
  width: 500px;
  .css-g1d714-ValueContainer {
    overflow: visible;
  }
`;

const SCOPE_HELPERTEXT = {
  CENTRAL: 'These settings stay on the central server and wont apply to any facilities',
  GLOBAL: 'These settings will apply to all facilities/devices',
  FACILITY: `These settings will only apply to this facility/devices linked to it`,
};

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
    label: 'All Facilities',
    value: null, // null is equivalent to all faciliites in backend logic
    tag: {
      label: 'Global',
      background: Colors.orange,
      color: Colors.white,
    },
  },
];

export const FacilitySelector = React.memo(({ selectedFacility, onChangeFacility }) => {
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
    <FacilitySelectorInput
      value={selectedFacility}
      onChange={onChangeFacility}
      options={BASIC_OPTIONS.concat(facilityOptions)}
      label="Select a facility/server to view and edit its settings"
      isClearable={false}
      helperText={helperText}
    />
  );
});
