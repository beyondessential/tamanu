import React from 'react';
import { IMAGING_REQUEST_STATUS_CONFIG, IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { DateField, LocalisedField, SelectField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';

const IMAGING_REQUEST_STATUS_OPTIONS = Object.values(IMAGING_REQUEST_STATUS_TYPES)
  .filter(
    type =>
      ![
        IMAGING_REQUEST_STATUS_TYPES.DELETED,
        IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
        IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
      ].includes(type),
  )
  .map(type => ({
    label: IMAGING_REQUEST_STATUS_CONFIG[type].label,
    value: type,
  }));

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
      initialValues={{ displayIdExact: true, ...searchParameters }}
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
