import React from 'react';
import { LAB_REQUEST_STATUS_OPTIONS } from 'shared/constants';
import { DateField, SelectField, LocalisedField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLabRequest } from '../../contexts/LabRequest';

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
