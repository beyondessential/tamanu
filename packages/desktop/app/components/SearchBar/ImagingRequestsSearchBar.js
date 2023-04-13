import React from 'react';
import { IMAGING_REQUEST_STATUS_OPTIONS } from '../../constants';
import { DateField, LocalisedField, SelectField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';

export const ImagingRequestsSearchBar = ({
  searchParameters,
  setSearchParameters,
  statusFilterTable,
}) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingPriorities = getLocalisation('imagingPriorities') || [];

  const imagingTypeOptions = Object.entries(imagingTypes).map(([key, val]) => ({
    label: val.label,
    value: key,
  }));

  return (
    <CustomisableSearchBar
      title="Search imaging requests"
      onSearch={setSearchParameters}
      initialValues={{ displayIdExact: true, ...searchParameters }}
    >
      <LocalisedField name="displayId" />
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="requestId" defaultLabel="Request ID" />
      {!statusFilterTable && (
        <LocalisedField
          name="status"
          defaultLabel="Status"
          component={SelectField}
          options={IMAGING_REQUEST_STATUS_OPTIONS}
        />
      )}
      <LocalisedField
        name="imagingType"
        defaultLabel="Type"
        component={SelectField}
        options={imagingTypeOptions}
      />
      <LocalisedField
        name="requestedDateFrom"
        defaultLabel="Requested from"
        saveDateAsString
        component={DateField}
      />
      <LocalisedField
        name="requestedDateTo"
        defaultLabel="Requested to"
        saveDateAsString
        component={DateField}
      />
      <LocalisedField
        name="priority"
        defaultLabel="Priority"
        component={SelectField}
        options={imagingPriorities}
      />
    </CustomisableSearchBar>
  );
};
