import React from 'react';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_CONFIG } from 'shared/constants';
import { DateField, SelectField, LocalisedField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLabRequest } from '../../contexts/LabRequest';

const LAB_REQUEST_STATUS_OPTIONS = Object.values(LAB_REQUEST_STATUSES)
  .filter(x => x !== LAB_REQUEST_STATUSES.DELETED && x !== LAB_REQUEST_STATUSES.ENTERED_IN_ERROR)
  .map(s => ({
    label: LAB_REQUEST_STATUS_CONFIG[s].label,
    value: s,
  }));

export const LabRequestsSearchBar = () => {
  const { searchParameters, setSearchParameters } = useLabRequest();
  return (
    <CustomisableSearchBar
      title="Search lab requests"
      initialValues={{ displayIdExact: true, ...searchParameters }}
      onSearch={setSearchParameters}
    >
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="displayId" />
      <LocalisedField name="requestId" defaultLabel="Request ID" />
      <LocalisedField name="category" defaultLabel="Type" />
      <LocalisedField
        name="status"
        defaultLabel="Status"
        component={SelectField}
        options={LAB_REQUEST_STATUS_OPTIONS}
      />
      <LocalisedField name="priority" defaultLabel="Priority" />
      <LocalisedField name="laboratory" defaultLabel="Laboratory" />
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
