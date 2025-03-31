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
            label={<TranslatedText
              stringId="general.area.label"
              fallback="Area"
              data-test-id='translatedtext-8tco' />}
            component={AutocompleteField}
            suggester={locationGroupSuggester}
            size="small"
            data-test-id='field-kd7c' />
          <Field
            name="departmentId"
            label={<TranslatedText
              stringId="general.department.label"
              fallback="Department"
              data-test-id='translatedtext-wyjs' />}
            component={AutocompleteField}
            suggester={departmentSuggester}
            size="small"
            data-test-id='field-x99r' />
          {publishedStatus ? (
            <Field
              name="publishedDate"
              label={
                <TranslatedText
                  stringId="lab.results.table.column.completedDate"
                  fallback="Completed"
                  data-test-id='translatedtext-o30l' />
              }
              saveDateAsString
              component={DateField}
              data-test-id='field-q2u4' />
          ) : (
            <>
              <LocalisedField
                name="laboratory"
                label={<TranslatedText
                  stringId="lab.laboratory.label"
                  fallback="Laboratory"
                  data-test-id='translatedtext-f6x9' />}
                component={SuggesterSelectField}
                endpoint="labTestLaboratory"
                size="small"
                data-test-id='localisedfield-jap2' />
              <LocalisedField
                name="priority"
                label={
                  <TranslatedText
                    stringId="general.localisedField.priority.label"
                    fallback="Priority"
                    data-test-id='translatedtext-e3e7' />
                }
                component={SuggesterSelectField}
                endpoint="labTestPriority"
                size="small"
                data-test-id='localisedfield-8zb4' />
            </>
          )}
          <FacilityCheckbox>
            <Field
              name="allFacilities"
              label={
                <TranslatedText
                  stringId="lab.allFacilities.label"
                  fallback="Include all facilities"
                  data-test-id='translatedtext-3dsd' />
              }
              component={CheckField}
              data-test-id='field-gm5s' />
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
              data-test-id='translatedtext-zhmi' />
          }
          component={SearchField}
          data-test-id='localisedfield-k618' />
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
              data-test-id='translatedtext-xlje' />
          }
          component={SearchField}
          data-test-id='localisedfield-2rhy' />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
              data-test-id='translatedtext-regt' />
          }
          component={SearchField}
          data-test-id='localisedfield-iuv8' />
        <Field
          name="requestId"
          label={<TranslatedText
            stringId="lab.requestId.label"
            fallback="Test ID"
            data-test-id='translatedtext-3055' />}
          component={SearchField}
          data-test-id='field-3yun' />
        <Field
          name="category"
          label={<TranslatedText
            stringId="lab.testCategory.label"
            fallback="Test category"
            data-test-id='translatedtext-yrar' />}
          component={SuggesterSelectField}
          endpoint="labTestCategory"
          size="small"
          data-test-id='field-qsz2' />
        <Field
          name="labTestPanelId"
          label={<TranslatedText
            stringId="lab.panel.label"
            fallback="Panel"
            data-test-id='translatedtext-yxnu' />}
          component={SuggesterSelectField}
          endpoint="labTestPanel"
          size="small"
          data-test-id='field-l486' />
        <LocalisedField
          name="requestedDateFrom"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedDateFrom.label"
              fallback="Requested from"
              data-test-id='translatedtext-ihhg' />
          }
          saveDateAsString
          component={DateField}
          $joined
          data-test-id='localisedfield-vt56' />
        <LocalisedField
          name="requestedDateTo"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedDateTo.label"
              fallback="Requested to"
              data-test-id='translatedtext-se1y' />
          }
          saveDateAsString
          component={DateField}
          data-test-id='localisedfield-osgh' />
        {publishedStatus ? (
          <LocalisedField
            name="laboratory"
            label={<TranslatedText
              stringId="lab.laboratory.label"
              fallback="Laboratory"
              data-test-id='translatedtext-bkpn' />}
            component={SuggesterSelectField}
            endpoint="labTestLaboratory"
            size="small"
            data-test-id='localisedfield-r8h0' />
        ) : (
          <LocalisedField
            name="status"
            label={
              <TranslatedText
                stringId="general.localisedField.status.label"
                fallback="Status"
                data-test-id='translatedtext-f7tq' />
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
            data-test-id='localisedfield-t09f' />
        )}
      </>
    </CustomisableSearchBarWithPermissionCheck>
  );
};
