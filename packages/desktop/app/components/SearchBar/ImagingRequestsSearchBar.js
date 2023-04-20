import React from 'react';
import { IMAGING_REQUEST_STATUS_OPTIONS } from '../../constants';
import { DateField, LocalisedField, SelectField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';

export const ImagingRequestsSearchBar = ({ searchParameters, setSearchParameters }) => {
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
      initialValues={searchParameters}
      staticValues={{ displayIdExact: true }}
    >
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="displayId" />
      <LocalisedField name="requestId" defaultLabel="Request ID" />
      <LocalisedField
        name="imagingType"
        defaultLabel="Type"
        component={SelectField}
        options={imagingTypeOptions}
      />
      <LocalisedField
        name="status"
        defaultLabel="Status"
        component={SelectField}
        options={IMAGING_REQUEST_STATUS_OPTIONS}
      />
      <LocalisedField
        name="priority"
        defaultLabel="Priority"
        component={SelectField}
        options={imagingPriorities}
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
    </CustomisableSearchBar>
  );
};
