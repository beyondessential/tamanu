import React from 'react';
import styled from 'styled-components';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_LABELS } from '@tamanu/constants';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  LocalisedField,
  SearchField,
  SuggesterSelectField,
  TranslatedSelectField,
} from '../Field';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { LabRequestSearchParamKeys, useLabRequest } from '../../contexts/LabRequest';
import { useSuggester } from '../../api';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';

const BASE_ADVANCED_FIELDS = ['locationGroupId', 'departmentId', 'allFacilities'];
const PUBLISHED_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS, 'publishedDate'];
const ALL_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS, 'priority', 'laboratory'];

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

export const LabRequestsSearchBar = ({ statuses }) => {
  const publishedStatus = statuses?.includes(LAB_REQUEST_STATUSES.PUBLISHED);
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
    <CustomisableSearchBarWithPermissionCheck
      verb="list"
      noun="LabRequest"
      initialValues={searchParameters}
      onSearch={setSearchParameters}
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      showExpandButton
      hiddenFields={
        <>
          <Field
            name="locationGroupId"
            label={<TranslatedText stringId="general.area.label" fallback="Area" />}
            component={AutocompleteField}
            suggester={locationGroupSuggester}
            size="small"
          />
          <Field
            name="departmentId"
            label={<TranslatedText stringId="general.department.label" fallback="Department" />}
            component={AutocompleteField}
            suggester={departmentSuggester}
            size="small"
          />
          {publishedStatus ? (
            <Field
              name="publishedDate"
              label={
                <TranslatedText
                  stringId="lab.results.table.column.completedDate"
                  fallback="Completed"
                />
              }
              saveDateAsString
              component={DateField}
            />
          ) : (
            <>
              <LocalisedField
                name="laboratory"
                label={<TranslatedText stringId="lab.laboratory.label" fallback="Laboratory" />}
                component={SuggesterSelectField}
                endpoint="labTestLaboratory"
                size="small"
              />
              <LocalisedField
                name="priority"
                label={
                  <TranslatedText
                    stringId="general.localisedField.priority.label"
                    fallback="Priority"
                  />
                }
                component={SuggesterSelectField}
                endpoint="labTestPriority"
                size="small"
              />
            </>
          )}
          <FacilityCheckbox>
            <Field
              name="allFacilities"
              label={
                <TranslatedText
                  stringId="lab.allFacilities.label"
                  fallback="Include all facilities"
                />
              }
              component={CheckField}
            />
          </FacilityCheckbox>
        </>
      }
    >
      <>
        <LocalisedField
          name="displayId"
          label={
            <TranslatedText
              stringId="general.localisedField.displayId.label.short"
              fallback="NHN"
            />
          }
          component={SearchField}
        />
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
            />
          }
          component={SearchField}
        />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
          }
          component={SearchField}
        />
        <Field
          name="requestId"
          label={<TranslatedText stringId="lab.requestId.label" fallback="Test ID" />}
          component={SearchField}
        />
        <Field
          name="category"
          label={<TranslatedText stringId="lab.testCategory.label" fallback="Test category" />}
          component={SuggesterSelectField}
          endpoint="labTestCategory"
          size="small"
        />
        <Field
          name="labTestPanelId"
          label={<TranslatedText stringId="lab.panel.label" fallback="Panel" />}
          component={SuggesterSelectField}
          endpoint="labTestPanel"
          size="small"
        />
        <LocalisedField
          name="requestedDateFrom"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedDateFrom.label"
              fallback="Requested from"
            />
          }
          saveDateAsString
          component={DateField}
          $joined
        />
        <LocalisedField
          name="requestedDateTo"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedDateTo.label"
              fallback="Requested to"
            />
          }
          saveDateAsString
          component={DateField}
        />
        {publishedStatus ? (
          <LocalisedField
            name="laboratory"
            label={<TranslatedText stringId="lab.laboratory.label" fallback="Laboratory" />}
            component={SuggesterSelectField}
            endpoint="labTestLaboratory"
            size="small"
          />
        ) : (
          <LocalisedField
            name="status"
            label={
              <TranslatedText stringId="general.localisedField.status.label" fallback="Status" />
            }
            component={TranslatedSelectField}
            transformOptions={options =>
              options.filter(
                option =>
                  ![
                    LAB_REQUEST_STATUSES.PUBLISHED,
                    LAB_REQUEST_STATUSES.DELETED,
                    LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
                    LAB_REQUEST_STATUSES.CANCELLED,
                    LAB_REQUEST_STATUSES.INVALIDATED,
                  ].includes(option.value),
              )
            }
            enumValues={LAB_REQUEST_STATUS_LABELS}
            size="small"
          />
        )}
      </>
    </CustomisableSearchBarWithPermissionCheck>
  );
};
