import React, { useState } from 'react';
import styled from 'styled-components';
import { LAB_REQUEST_STATUSES } from 'shared/constants/labs';
import {
  DateField,
  SelectField,
  LocalisedField,
  Field,
  SuggesterSelectField,
  SearchField,
  DisplayIdField,
  AutocompleteField,
  CheckField,
} from '../Field';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../constants';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLabRequest } from '../../contexts/LabRequest';
import { useSuggester } from '../../api';

const useAdvancedFields = advancedFields => {
  const { searchParameters, setSearchParameters } = useLabRequest();

  // If one of the advanced fields is filled in when landing on the screen,
  // show the advanced fields section
  const defaultIsOpen = Object.keys(searchParameters).some(searchKey =>
    advancedFields.includes(searchKey),
  );
  const [showAdvancedFields, setShowAdvancedFields] = useState(defaultIsOpen);

  return { showAdvancedFields, setShowAdvancedFields, searchParameters, setSearchParameters };
};

const ADVANCED_FIELDS = ['locationGroupId', 'departmentId', 'laboratory', 'priority'];

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

export const LabRequestsSearchBar = ({ excludePublished }) => {
  const {
    showAdvancedFields,
    setShowAdvancedFields,
    searchParameters,
    setSearchParameters,
  } = useAdvancedFields(ADVANCED_FIELDS);
  const locationGroupSuggester = useSuggester('locationGroup');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  return (
    <CustomisableSearchBar
      initialValues={searchParameters}
      staticValues={{ displayIdExact: true }}
      onSearch={setSearchParameters}
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      showExpandButton
      hiddenFields={
        <>
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
          name="labTestPanelId"
          label="Panel"
          component={SuggesterSelectField}
          endpoint="labTestPanel"
          size="small"
        />
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
        <LocalisedField
          name="status"
          defaultLabel="Status"
          component={SelectField}
          options={
            excludePublished
              ? LAB_REQUEST_STATUS_OPTIONS.filter(
                  option => option.value !== LAB_REQUEST_STATUSES.PUBLISHED,
                )
              : LAB_REQUEST_STATUS_OPTIONS
          }
          size="small"
        />
        <FacilityCheckbox>
          <Field name="allFacilities" label="Include all facilities" component={CheckField} />
        </FacilityCheckbox>
      </>
    </CustomisableSearchBar>
  );
};
