import React from 'react';
import styled from 'styled-components';
import { LAB_REQUEST_STATUSES } from '@tamanu/shared/constants';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../constants';
import {
  DateField,
  SelectField,
  LocalisedField,
  Field,
  SuggesterSelectField,
  SearchField,
  AutocompleteField,
  CheckField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLabRequest, LabRequestSearchParamKeys } from '../../contexts/LabRequest';
import { useSuggester } from '../../api';
import { useAdvancedFields } from './useAdvancedFields';

const BASE_ADVANCED_FIELDS = ['locationGroupId', 'departmentId', 'allFacilities'];
const PUBLISHED_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS, 'publishedDate'];
const ALL_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS, 'priority', 'laboratory'];

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

export const LabRequestsSearchBar = ({ status = '' }) => {
  const publishedStatus = status === LAB_REQUEST_STATUSES.PUBLISHED;
  const { searchParameters, setSearchParameters } = useLabRequest(
    publishedStatus ? LabRequestSearchParamKeys.Published : LabRequestSearchParamKeys.All,
  );

  const advancedFields = publishedStatus ? PUBLISHED_ADVANCED_FIELDS : ALL_ADVANCED_FIELDS;
  const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
    advancedFields,
    searchParameters,
  );
  const locationGroupSuggester = useSuggester('locationGroup');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: {
      filterByFacility: true,
    },
  });

  return (
    <CustomisableSearchBar
      initialValues={searchParameters}
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
        <LocalisedField useShortLabel keepLetterCase name="displayId" component={SearchField} />
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
