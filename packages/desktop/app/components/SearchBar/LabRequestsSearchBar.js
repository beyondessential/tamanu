import React from 'react';
import styled from 'styled-components';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../constants';
import { DateField, SelectField, LocalisedField, Field, CheckField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLabRequest } from '../../contexts/LabRequest';

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

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
      <FacilityCheckbox>
        <Field name="allFacilities" label="Include all facilities" component={CheckField} />
      </FacilityCheckbox>
    </CustomisableSearchBar>
  );
};
