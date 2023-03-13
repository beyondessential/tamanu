import React, { useState } from 'react';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../constants';
import {
  DateField,
  SelectField,
  LocalisedField,
  Field,
  SuggesterSelectField,
  SearchField,
  DisplayIdField,
  AutocompleteField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLabRequest } from '../../contexts/LabRequest';
import { useSuggester } from '../../api';

export const LabRequestsSearchBar = () => {
  const { searchParameters, setSearchParameters } = useLabRequest();
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  return (
    <CustomisableSearchBar
      initialValues={{ displayIdExact: true, ...searchParameters }}
      onSearch={setSearchParameters}
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      showExpandButton
      hiddenFields={
        <>
          <LocalisedField
            name="requestedDateFrom"
            label="Requested from"
            saveDateAsString
            component={DateField}
            $joined
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
            size="small"
          />
        </>
      }
    >
      <>
        <DisplayIdField />
        <LocalisedField name="firstName" component={SearchField} />
        <LocalisedField name="lastName" component={SearchField} />
        <Field name="requestId" label="Test ID" component={SearchField} />
        <Field
          name="category"
          label="Test category"
          component={SuggesterSelectField}
          endpoint="labTestCategory"
          size="small"
        />
        <Field
          name="locationGroupId"
          label="Area"
          component={AutocompleteField}
          suggester={locationGroupSuggester}
          size="small"
        />
        <Field
          name="departmentId"
          label="Department"
          component={AutocompleteField}
          suggester={departmentSuggester}
          size="small"
        />
        <LocalisedField
          name="laboratory"
          defaultLabel="Laboratory"
          component={SuggesterSelectField}
          endpoint="labTestLaboratory"
          size="small"
        />
        <LocalisedField
          name="status"
          defaultLabel="Status"
          component={SelectField}
          options={LAB_REQUEST_STATUS_OPTIONS}
          size="small"
        />
      </>
    </CustomisableSearchBar>
  );
};
