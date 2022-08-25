import React from 'react';
import { DateField, SelectField, LocalisedField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { LAB_REQUEST_STATUS_LABELS, LAB_REQUEST_STATUSES } from '../../constants';
import { useLabRequest } from '../../contexts/LabRequest';

const STATUS_OPTIONS = Object.values(LAB_REQUEST_STATUSES).map(s => ({
  label: LAB_REQUEST_STATUS_LABELS[s],
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
        options={STATUS_OPTIONS}
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
