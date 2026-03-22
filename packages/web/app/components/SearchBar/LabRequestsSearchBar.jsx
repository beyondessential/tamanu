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
            label={
              <TranslatedText
                stringId="general.area.label"
                fallback="Area"
                data-testid="translatedtext-6pqs"
              />
            }
            component={AutocompleteField}
            suggester={locationGroupSuggester}
            size="small"
            data-testid="field-5dyf"
          />
          <Field
            name="departmentId"
            label={
              <TranslatedText
                stringId="general.department.label"
                fallback="Department"
                data-testid="translatedtext-w8ao"
              />
            }
            component={AutocompleteField}
            suggester={departmentSuggester}
            size="small"
            data-testid="field-r8d2"
          />
          {publishedStatus ? (
            <Field
              name="publishedDate"
              label={
                <TranslatedText
                  stringId="lab.results.table.column.completedDate"
                  fallback="Completed"
                  data-testid="translatedtext-v0cq"
                />
              }
              component={DateField}
              data-testid="field-ifhe"
            />
          ) : (
            <>
              <LocalisedField
                name="laboratory"
                label={
                  <TranslatedText
                    stringId="lab.laboratory.label"
                    fallback="Laboratory"
                    data-testid="translatedtext-tt4b"
                  />
                }
                component={SuggesterSelectField}
                endpoint="labTestLaboratory"
                size="small"
                data-testid="localisedfield-myai"
              />
              <LocalisedField
                name="priority"
                label={
                  <TranslatedText
                    stringId="general.localisedField.priority.label"
                    fallback="Priority"
                    data-testid="translatedtext-ph6s"
                  />
                }
                component={SuggesterSelectField}
                endpoint="labTestPriority"
                size="small"
                data-testid="localisedfield-zh5y"
              />
            </>
          )}
          <FacilityCheckbox data-testid="facilitycheckbox-k5oo">
            <Field
              name="allFacilities"
              label={
                <TranslatedText
                  stringId="lab.allFacilities.label"
                  fallback="Include all facilities"
                  data-testid="translatedtext-0q1s"
                />
              }
              component={CheckField}
              data-testid="field-2zdm"
            />
          </FacilityCheckbox>
        </>
      }
      data-testid="customisablesearchbarwithpermissioncheck-29hw"
    >
      <>
        <LocalisedField
          name="displayId"
          label={
            <TranslatedText
              stringId="general.localisedField.displayId.label.short"
              fallback="NHN"
              data-testid="translatedtext-fajs"
            />
          }
          component={SearchField}
          data-testid="localisedfield-5eui"
        />
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
              data-testid="translatedtext-2q54"
            />
          }
          component={SearchField}
          data-testid="localisedfield-w99c"
        />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
              data-testid="translatedtext-ow8a"
            />
          }
          component={SearchField}
          data-testid="localisedfield-3lzc"
        />
        <Field
          name="requestId"
          label={
            <TranslatedText
              stringId="lab.requestId.label.short"
              fallback="Test ID"
              data-testid="translatedtext-8b9r"
            />
          }
          component={SearchField}
          data-testid="field-jpmb"
        />
        <Field
          name="category"
          label={
            <TranslatedText
              stringId="lab.testCategory.label"
              fallback="Test category"
              data-testid="translatedtext-iate"
            />
          }
          component={SuggesterSelectField}
          endpoint="labTestCategory"
          size="small"
          data-testid="field-84q8"
        />
        <Field
          name="labTestPanelId"
          label={
            <TranslatedText
              stringId="lab.panel.label"
              fallback="Panel"
              data-testid="translatedtext-6w50"
            />
          }
          component={SuggesterSelectField}
          endpoint="labTestPanel"
          size="small"
          data-testid="field-vqdd"
        />
        <LocalisedField
          name="requestedDateFrom"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedDateFrom.label"
              fallback="Requested from"
              data-testid="translatedtext-0gk7"
            />
          }
          component={DateField}
          $joined
          data-testid="localisedfield-vo15"
        />
        <LocalisedField
          name="requestedDateTo"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedDateTo.label"
              fallback="Requested to"
              data-testid="translatedtext-l4xg"
            />
          }
          component={DateField}
          data-testid="localisedfield-kswp"
        />
        {publishedStatus ? (
          <LocalisedField
            name="laboratory"
            label={
              <TranslatedText
                stringId="lab.laboratory.label"
                fallback="Laboratory"
                data-testid="translatedtext-zw6f"
              />
            }
            component={SuggesterSelectField}
            endpoint="labTestLaboratory"
            size="small"
            data-testid="localisedfield-7jda"
          />
        ) : (
          <LocalisedField
            name="status"
            label={
              <TranslatedText
                stringId="general.localisedField.status.label"
                fallback="Status"
                data-testid="translatedtext-763d"
              />
            }
            component={TranslatedSelectField}
            transformOptions={(options) =>
              options.filter(
                (option) =>
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
            data-testid="localisedfield-2it8"
          />
        )}
      </>
    </CustomisableSearchBarWithPermissionCheck>
  );
};
