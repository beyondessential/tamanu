import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useApi } from '../../../../api';
import { SelectField } from '../../../../components';
import { TranslatedText } from '../../../../components/Translation';

const ScopeSelectorField = styled(SelectField)`
  width: 300px;
  margin-right: 5px;
  margin-bottom: 10px;
  div:first-child {
    overflow: visible;
    margin-bottom: 0;
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

export const ScopeSelectorFields = React.memo(
  ({ handleChangeScope, scope, handleChangeFacilityId, facilityId }) => {
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
        <ScopeSelectorField
          name="scope"
          label={<TranslatedText stringId="admin.settings.scope.label" fallback="Scope" />}
          options={SCOPE_OPTIONS}
          onChange={handleChangeScope}
          value={scope}
          isClearable={false}
          error={!!error}
        />
        {scope === SETTINGS_SCOPES.FACILITY && (
          <ScopeSelectorField
            name="facilityId"
            options={facilityOptions}
            label={<TranslatedText stringId="general.facility.label" fallback="Facility" />}
            isClearable={false}
            onChange={handleChangeFacilityId}
            value={facilityId}
            error={!!error}
            required
          />
        )}
      </>
    );
  },
);
