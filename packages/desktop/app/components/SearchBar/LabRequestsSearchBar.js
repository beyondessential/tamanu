import React from 'react';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../constants';
import {
  DateField,
  SelectField,
  Field,
  LocalisedField,
  SearchField,
  SuggesterSelectField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLabRequest } from '../../contexts/LabRequest';

export const LabRequestsSearchBar = () => {
  const { searchParameters, setSearchParameters } = useLabRequest();
  return (
    <CustomisableSearchBar
      title="Search lab requests"
      variant="small"
      initialValues={{ displayIdExact: true, ...searchParameters }}
      onSearch={setSearchParameters}
    >
      <Field name="displayId" label="NHN" component={SearchField} />
      <Field name="firstName" label="Patient name" component={SearchField} />
      <Field name="requestId" label="Test ID" component={SearchField} />
      <Field
        name="category"
        label="Test category"
        component={SuggesterSelectField}
        endpoint="labTestCategory"
      />
      <Field name="locationGroup" label="Area" component={SearchField} />
      <Field name="department" label="Department" />
      <LocalisedField
        name="laboratory"
        defaultLabel="Laboratory"
        component={SuggesterSelectField}
        endpoint="labTestLaboratory"
      />
      <LocalisedField
        name="status"
        defaultLabel="Status"
        component={SelectField}
        options={LAB_REQUEST_STATUS_OPTIONS}
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
      <Field name="author" label="Requested by" component={SearchField} />
      <LocalisedField
        name="priority"
        defaultLabel="Priority"
        component={SuggesterSelectField}
        endpoint="labTestPriority"
      />
    </CustomisableSearchBar>
  );
};
