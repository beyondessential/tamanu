import React, { useState } from 'react';
import styled from 'styled-components';
import { LAB_REQUEST_STATUSES } from 'shared/constants/labs';
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
  CheckField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLabRequest, LabRequestSearchParamKeys } from '../../contexts/LabRequest';
import { useSuggester } from '../../api';

const useAdvancedFields = (advancedFields, publishedStatus) => {
  const { searchParameters, setSearchParameters } = useLabRequest(
    publishedStatus ? LabRequestSearchParamKeys.Published : LabRequestSearchParamKeys.All,
  );

  // If one of the advanced fields is filled in when landing on the screen,
  // show the advanced fields section
  const defaultIsOpen = Object.keys(searchParameters).some(searchKey =>
    advancedFields.includes(searchKey),
  );
  const [showAdvancedFields, setShowAdvancedFields] = useState(defaultIsOpen);

  return { showAdvancedFields, setShowAdvancedFields, searchParameters, setSearchParameters };
};

const ADVANCED_FIELDS = ['locationGroupId', 'laboratory', 'priority'];

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

export const LabRequestsSearchBar = ({ status = '' }) => {
  const publishedStatus = status === LAB_REQUEST_STATUSES.PUBLISHED;
  const {
    showAdvancedFields,
    setShowAdvancedFields,
    searchParameters,
    setSearchParameters,
  } = useAdvancedFields(ADVANCED_FIELDS, publishedStatus);
  const locationGroupSuggester = useSuggester('locationGroup');

  return (
    <CustomisableSearchBar
      title="Search lab requests"
      initialValues={{ displayIdExact: true, ...searchParameters }}
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
          {publishedStatus ? (
            <Field name="publishedDate" label="Completed" saveDateAsString component={DateField} />
          ) : (
            <>
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
          )}
          <FacilityCheckbox>
            <Field name="allFacilities" label="Include all facilities" component={CheckField} />
          </FacilityCheckbox>
        </>
      }
    >
      <>
        <DisplayIdField useShortLabel />
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
        {publishedStatus ? (
          <LocalisedField
            name="laboratory"
            defaultLabel="Laboratory"
            component={SuggesterSelectField}
            endpoint="labTestLaboratory"
            size="small"
          />
        ) : (
          <LocalisedField
            name="status"
            defaultLabel="Status"
            component={SelectField}
            options={LAB_REQUEST_STATUS_OPTIONS.filter(
              option => option.value !== LAB_REQUEST_STATUSES.PUBLISHED,
            )}
            size="small"
          />
        )}
      </>
    </CustomisableSearchBar>
  );
};
