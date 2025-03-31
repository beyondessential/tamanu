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
              data-testid='translatedtext-8tco' />}
            component={AutocompleteField}
            suggester={locationGroupSuggester}
            size="small"
            data-testid='field-kd7c' />
          <Field
            name="departmentId"
            label={<TranslatedText
              stringId="general.department.label"
              fallback="Department"
              data-testid='translatedtext-wyjs' />}
            component={AutocompleteField}
            suggester={departmentSuggester}
            size="small"
            data-testid='field-x99r' />
          {publishedStatus ? (
            <Field
              name="publishedDate"
              label={
                <TranslatedText
                  stringId="lab.results.table.column.completedDate"
                  fallback="Completed"
                  data-testid='translatedtext-o30l' />
              }
              saveDateAsString
              component={DateField}
              data-testid='field-q2u4' />
          ) : (
            <>
              <LocalisedField
                name="laboratory"
                label={<TranslatedText
                  stringId="lab.laboratory.label"
                  fallback="Laboratory"
                  data-testid='translatedtext-f6x9' />}
                component={SuggesterSelectField}
                endpoint="labTestLaboratory"
                size="small"
                data-testid='localisedfield-jap2' />
              <LocalisedField
                name="priority"
                label={
                  <TranslatedText
                    stringId="general.localisedField.priority.label"
                    fallback="Priority"
                    data-testid='translatedtext-e3e7' />
                }
                component={SuggesterSelectField}
                endpoint="labTestPriority"
                size="small"
                data-testid='localisedfield-8zb4' />
            </>
          )}
          <FacilityCheckbox>
            <Field
              name="allFacilities"
              label={
                <TranslatedText
                  stringId="lab.allFacilities.label"
                  fallback="Include all facilities"
                  data-testid='translatedtext-3dsd' />
              }
              component={CheckField}
              data-testid='field-gm5s' />
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
              data-testid='translatedtext-zhmi' />
          }
          component={SearchField}
          data-testid='localisedfield-k618' />
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
              data-testid='translatedtext-xlje' />
          }
          component={SearchField}
          data-testid='localisedfield-2rhy' />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
              data-testid='translatedtext-regt' />
          }
          component={SearchField}
          data-testid='localisedfield-iuv8' />
        <Field
          name="requestId"
          label={<TranslatedText
            stringId="lab.requestId.label"
            fallback="Test ID"
            data-testid='translatedtext-3055' />}
          component={SearchField}
          data-testid='field-3yun' />
        <Field
          name="category"
          label={<TranslatedText
            stringId="lab.testCategory.label"
            fallback="Test category"
            data-testid='translatedtext-yrar' />}
          component={SuggesterSelectField}
          endpoint="labTestCategory"
          size="small"
          data-testid='field-qsz2' />
        <Field
          name="labTestPanelId"
          label={<TranslatedText
            stringId="lab.panel.label"
            fallback="Panel"
            data-testid='translatedtext-yxnu' />}
          component={SuggesterSelectField}
          endpoint="labTestPanel"
          size="small"
          data-testid='field-l486' />
        <LocalisedField
          name="requestedDateFrom"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedDateFrom.label"
              fallback="Requested from"
              data-testid='translatedtext-ihhg' />
          }
          saveDateAsString
          component={DateField}
          $joined
          data-testid='localisedfield-vt56' />
        <LocalisedField
          name="requestedDateTo"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedDateTo.label"
              fallback="Requested to"
              data-testid='translatedtext-se1y' />
          }
          saveDateAsString
          component={DateField}
          data-testid='localisedfield-osgh' />
        {publishedStatus ? (
          <LocalisedField
            name="laboratory"
            label={<TranslatedText
              stringId="lab.laboratory.label"
              fallback="Laboratory"
              data-testid='translatedtext-bkpn' />}
            component={SuggesterSelectField}
            endpoint="labTestLaboratory"
            size="small"
            data-testid='localisedfield-r8h0' />
        ) : (
          <LocalisedField
            name="status"
            label={
              <TranslatedText
                stringId="general.localisedField.status.label"
                fallback="Status"
                data-testid='translatedtext-f7tq' />
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
            data-testid='localisedfield-t09f' />
        )}
      </>
    </CustomisableSearchBarWithPermissionCheck>
  );
};
