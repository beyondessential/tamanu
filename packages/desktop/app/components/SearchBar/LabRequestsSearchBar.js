import React, { useState } from 'react';
import styled from 'styled-components';
import { Collapse, Box } from '@material-ui/core';
import { LAB_REQUEST_STATUS_OPTIONS, Colors } from '../../constants';
import {
  DateField,
  SelectField,
  Field,
  LocalisedField,
  SearchField,
  SuggesterSelectField,
  AutocompleteField,
  Form,
} from '../Field';
import { SearchBarContainer, SearchBarSubmitButtons } from './SearchBar';
import { useLabRequest } from '../../contexts/LabRequest';
import { useSuggester } from '../../api';

const Container = styled(SearchBarContainer)`
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  border: 1px solid ${Colors.outline};
  background: white;
  padding: 15px 26px 20px;
`;

const SearchInputContainer = styled(Box)`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 9px;
`;

export const LabRequestsSearchBar = () => {
  const { searchParameters, setSearchParameters } = useLabRequest();
  const [isOpen, setIsOpen] = useState(false);
  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  return (
    <Form
      initialValues={{ displayIdExact: true, ...searchParameters }}
      onSubmit={setSearchParameters}
      render={({ clearForm }) => {
        return (
          <Container>
            <SearchInputContainer>
              <Field name="displayId" label="NHN" component={SearchField} />
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
              <SearchBarSubmitButtons
                clickToggle={() => {
                  setIsOpen(current => !current);
                }}
                clearForm={clearForm}
              />
            </SearchInputContainer>
            <Collapse in={isOpen}>
              <SearchInputContainer mt={2}>
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
              </SearchInputContainer>
            </Collapse>
          </Container>
        );
      }}
    />
  );
};
