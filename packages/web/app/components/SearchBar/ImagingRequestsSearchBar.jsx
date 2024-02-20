import React from 'react';
import styled from 'styled-components';
import { IMAGING_REQUEST_STATUS_TYPES, IMAGING_TABLE_VERSIONS } from '@tamanu/constants';
import { IMAGING_REQUEST_STATUS_OPTIONS } from '../../constants';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  LocalisedField,
  SearchField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';
import { useSuggester } from '../../api';
import { useImagingRequests } from '../../contexts/ImagingRequests';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';
import { SelectField } from '../Translation/TranslatedSelectField.jsx';

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
                    stringId="general.localisedField.requestedById.label"
                    fallback="Requested by"
                  />
                }
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
                stringId="general.localisedField.locationGroupId.label"
                fallback="Area"
              />
            }
            component={AutocompleteField}
            suggester={areaSuggester}
            size="small"
          />
          <LocalisedField
            name="departmentId"
            label={
              <TranslatedText
                stringId="general.localisedField.departmentId.label"
                fallback="Department"
              />
            }
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
                    stringId="general.localisedField.completedAt.label"
                    fallback="Completed"
                  />
                }
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
        keepLetterCase
        name="displayId"
        label={
          <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
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
      <LocalisedField
        name="requestId"
        defaultLabel="Request ID"
        label={
          <TranslatedText stringId="general.localisedField.requestId.label" fallback="Request ID" />
        }
        component={SearchField}
      />
      {!isCompletedTable && (
        <LocalisedField
          name="status"
          label={
            <TranslatedText stringId="general.localisedField.status.label" fallback="Status" />
          }
          component={SelectField}
          options={IMAGING_REQUEST_STATUS_OPTIONS.filter(
            ({ value }) => value !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          )}
          size="small"
          prefix="imaging.property.status"
        />
      )}
      {isCompletedTable && <Spacer />}
      <LocalisedField
        name="imagingType"
        label={
          <TranslatedText stringId="general.localisedField.imagingType.label" fallback="Type" />
        }
        component={SelectField}
        options={imagingTypeOptions}
        size="small"
        prefix="imaging.property.type"
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
      {!isCompletedTable && (
        <LocalisedField
          name="priority"
          label={
            <TranslatedText stringId="general.localisedField.priority.label" fallback="Priority" />
          }
          component={SelectField}
          options={imagingPriorities}
          size="small"
          prefix="imaging.property.priority"
        />
      )}
      {isCompletedTable && (
        <LocalisedField
          name="requestedById"
          label={
            <TranslatedText
              stringId="general.localisedField.requestedById.label"
              fallback="Requested by"
            />
          }
          component={AutocompleteField}
          suggester={requesterSuggester}
          size="small"
        />
      )}
    </CustomisableSearchBar>
  );
};
