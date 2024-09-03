import React from 'react';
import styled from 'styled-components';
import { useField } from 'formik';
import { useQuery } from '@tanstack/react-query';
import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useApi } from '../../../api';
import { Field, SelectField } from '../../../components';
import { TranslatedText } from '../../../components/Translation';

const ScopeSelectorField = styled(SelectField)`
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

export const ScopeSelectorFields = React.memo(({ onChangeScope, onChangeFacility }) => {
  const api = useApi();
  const { value: scopeValue } = useField('scope')[0];
  const { setValue: setFacilityId } = useField('facilityId')[2];

  const { data: facilitiesArray = [], error } = useQuery(['facilitiesList'], () =>
    api.get('admin/facilities'),
  );

  const facilityOptions = facilitiesArray.map(facility => ({
    label: facility.name,
    value: facility.id,
  }));

  const handleChangeScope = value => {
    setFacilityId(null);
    if (onChangeScope) {
      onChangeScope(value);
    }
  };

  return (
    <>
      <Field
        name="scope"
        label={<TranslatedText stringId="admin.settings.scope.label" fallback="Scope" />}
        component={ScopeSelectorField}
        options={SCOPE_OPTIONS}
        onChange={handleChangeScope}
        isClearable={false}
        error={!!error}
      />
      {scopeValue === SETTINGS_SCOPES.FACILITY && (
        <Field
          name="facilityId"
          options={facilityOptions}
          label={<TranslatedText stringId="general.facility.label" fallback="Facility" />}
          isClearable={false}
          onChange={onChangeFacility}
          component={ScopeSelectorField}
          error={!!error}
        />
      )}
    </>
  );
});
