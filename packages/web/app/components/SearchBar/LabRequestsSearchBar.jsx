import React from 'react';
import styled from 'styled-components';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../constants';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  LocalisedField,
  SearchField,
  BaseSelectField,
  SuggesterSelectField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { LabRequestSearchParamKeys, useLabRequest } from '../../contexts/LabRequest';
import { useSuggester } from '../../api';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';

const BASE_ADVANCED_FIELDS = ['locationGroupId', 'departmentId', 'allFacilities'];
const PUBLISHED_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS, 'publishedDate'];
const ALL_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS, 'priority', 'laboratory'];
import { TranslatedSelectField } from '../Translation/TranslatedSelectField.jsx';

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
                label={
                  <TranslatedText
                    stringId="general.localisedField.laboratory.label"
                    fallback="Laboratory"
                  />
                }
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
            <Field name="allFacilities" label="Include all facilities" component={CheckField} />
          </FacilityCheckbox>
        </>
      }
    >
      <>
        <LocalisedField
          keepLetterCase
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
            label={
              <TranslatedText
                stringId="general.localisedField.laboratory.label"
                fallback="Laboratory"
              />
            }
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
            options={LAB_REQUEST_STATUS_OPTIONS.filter(
              option => option.value !== LAB_REQUEST_STATUSES.PUBLISHED,
            )}
            size="small"
            prefix="labs.property.status"
          />
        )}
      </>
    </CustomisableSearchBar>
  );
};
