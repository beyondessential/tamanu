import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { SETTINGS_SCOPES } from '@tamanu/constants';

import { useApi } from '../../../api';
import { Field, SelectField } from '../../../components';
import { TranslatedText } from '../../../components/Translation';
import { useField } from 'formik';

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
  const [{ value: scopeValue }] = useField('scope');
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
      <Field
        name="scope"
        label={<TranslatedText stringId="admin.settings.scope.label" fallback="Scope" />}
        component={ScopeSelectorField}
        options={SCOPE_OPTIONS}
        onChange={onChangeScope}
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
