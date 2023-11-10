import React from 'react';
import styled from 'styled-components';
import { IMAGING_TABLE_VERSIONS, IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';
import { IMAGING_REQUEST_STATUS_OPTIONS } from '../../constants';
import {
  DateField,
  LocalisedField,
  SelectField,
  AutocompleteField,
  Field,
  CheckField,
  SearchField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';
import { useSuggester } from '../../api';
import { useImagingRequests } from '../../contexts/ImagingRequests';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

const Spacer = styled.div`
  width: 100%;
`;

export const ImagingRequestsSearchBar = ({ memoryKey, statuses = [], advancedFields }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingPriorities = getLocalisation('imagingPriorities') || [];
  const areaSuggester = useSuggester('locationGroup');
  const departmentSuggester = useSuggester('department');
  const requesterSuggester = useSuggester('practitioner');
  const isCompletedTable = memoryKey === IMAGING_TABLE_VERSIONS.COMPLETED.memoryKey;

  const { searchParameters, setSearchParameters } = useImagingRequests(memoryKey);

  const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
    advancedFields,
    searchParameters,
  );
  const statusFilter = statuses ? { status: statuses } : {};

  const imagingTypeOptions = Object.entries(imagingTypes).map(([key, val]) => ({
    label: val.label,
    value: key,
  }));

  return (
    <CustomisableSearchBar
      showExpandButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      title="Search imaging requests"
      onSearch={setSearchParameters}
      initialValues={{ ...statusFilter, ...searchParameters }}
      hiddenFields={
        <>
          {!isCompletedTable && (
            <>
              <LocalisedField
                name="requestedById"
                label={
                  <TranslatedText
                    stringId="general.localisedFields.requestedById.label"
                    fallback="TODO"
                  />
                }
                defaultLabel="Requested by"
                saveDateAsString
                component={AutocompleteField}
                suggester={requesterSuggester}
              />
            </>
          )}
          <LocalisedField
            name="locationGroupId"
            label={
              <TranslatedText
                stringId="general.localisedFields.locationGroupId.label"
                fallback="TODO"
              />
            }
            defaultLabel="Area"
            component={AutocompleteField}
            suggester={areaSuggester}
            size="small"
          />
          <LocalisedField
            name="departmentId"
            label={
              <TranslatedText
                stringId="general.localisedFields.departmentId.label"
                fallback="TODO"
              />
            }
            defaultLabel="Department"
            component={AutocompleteField}
            suggester={departmentSuggester}
            size="small"
          />
          {isCompletedTable && (
            <>
              <LocalisedField
                name="completedAt"
                label={
                  <TranslatedText
                    stringId="general.localisedFields.completedAt.label"
                    fallback="TODO"
                  />
                }
                defaultLabel="Completed"
                saveDateAsString
                component={DateField}
              />
            </>
          )}
          <FacilityCheckbox>
            <Field name="allFacilities" label="Include all facilities" component={CheckField} />
          </FacilityCheckbox>
        </>
      }
    >
      <LocalisedField
        useShortLabel
        keepLetterCase
        name="displayId"
        label={
          <TranslatedText stringId="general.localisedFields.displayId.label.short" fallback="NHN" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedFields.firstName.label"
            fallback="First name"
          />
        }
        component={SearchField}
      />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText stringId="general.localisedFields.lastName.label" fallback="Last name" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="requestId"
        defaultLabel="Request ID"
        label={
          <TranslatedText
            stringId="general.localisedFields.requestId"
            defaultLabel="Request ID.label"
            fallback="TODO"
          />
        }
        component={SearchField}
      />
      {!isCompletedTable && (
        <LocalisedField
          name="status"
          label={
            <TranslatedText stringId="general.localisedFields.status.label" fallback="Status" />
          }
          component={SelectField}
          options={IMAGING_REQUEST_STATUS_OPTIONS.filter(
            ({ value }) => value !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          )}
          size="small"
        />
      )}
      {isCompletedTable && <Spacer />}
      <LocalisedField
        name="imagingType"
        label={
          <TranslatedText stringId="general.localisedFields.imagingType.label" fallback="Type" />
        }
        component={SelectField}
        options={imagingTypeOptions}
        size="small"
      />
      <LocalisedField
        name="requestedDateFrom"
        label={
          <TranslatedText
            stringId="general.localisedFields.requestedDateFrom.label"
            fallback="Requested from"
          />
        }
        saveDateAsString
        component={DateField}
      />
      <LocalisedField
        name="requestedDateTo"
        label={
          <TranslatedText
            stringId="general.localisedFields.requestedDateTo.label"
            fallback="TODO"
          />
        }
        defaultLabel="Requested to"
        saveDateAsString
        component={DateField}
      />
      {!isCompletedTable && (
        <LocalisedField
          name="priority"
          label={
            <TranslatedText stringId="general.localisedFields.priority.label" fallback="Priority" />
          }
          component={SelectField}
          options={imagingPriorities}
          size="small"
        />
      )}
      {isCompletedTable && (
        <LocalisedField
          name="requestedById"
          label={
            <TranslatedText
              stringId="general.localisedFields.requestedById.label"
              fallback="TODO"
            />
          }
          defaultLabel="Requested by"
          component={AutocompleteField}
          suggester={requesterSuggester}
          size="small"
        />
      )}
    </CustomisableSearchBar>
  );
};
