import React from 'react';
import styled from 'styled-components';
import {
  IMAGING_REQUEST_STATUS_LABELS,
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TABLE_VERSIONS,
} from '@tamanu/constants';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  LocalisedField,
  SearchField,
  SelectField,
  TranslatedSelectField,
} from '../Field';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';
import { useSuggester } from '../../api';
import { useImagingRequestsQuery } from '../../contexts/ImagingRequests';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';
import { useSettings } from '../../contexts/Settings';

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
  const { getSetting } = useSettings();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingPriorities = getSetting('imagingPriorities') || [];
  const areaSuggester = useSuggester('locationGroup');
  const departmentSuggester = useSuggester('department');
  const requesterSuggester = useSuggester('practitioner');
  const isCompletedTable = memoryKey === IMAGING_TABLE_VERSIONS.COMPLETED.memoryKey;

  const { searchParameters, setSearchParameters } = useImagingRequestsQuery(memoryKey);

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
    <CustomisableSearchBarWithPermissionCheck
      verb="list"
      noun="ImagingRequest"
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
                    stringId="general.requestedBy.label"
                    fallback="Requested by"
                    data-test-id='translatedtext-m9j9' />
                }
                saveDateAsString
                component={AutocompleteField}
                suggester={requesterSuggester}
                data-test-id='localisedfield-hc12' />
            </>
          )}
          <LocalisedField
            name="locationGroupId"
            label={
              <TranslatedText
                stringId="general.localisedField.locationGroupId.label"
                fallback="Area"
                data-test-id='translatedtext-2amd' />
            }
            component={AutocompleteField}
            suggester={areaSuggester}
            size="small"
            data-test-id='localisedfield-epow' />
          <Field
            name="departmentId"
            label={<TranslatedText
              stringId="general.department.label"
              fallback="Department"
              data-test-id='translatedtext-ziwj' />}
            component={AutocompleteField}
            suggester={departmentSuggester}
            size="small"
            data-test-id='field-czc7' />
          {isCompletedTable && (
            <>
              <LocalisedField
                name="completedAt"
                label={
                  <TranslatedText
                    stringId="general.localisedField.completedAt.label"
                    fallback="Completed"
                    data-test-id='translatedtext-av4b' />
                }
                saveDateAsString
                component={DateField}
                data-test-id='localisedfield-upmr' />
            </>
          )}
          <FacilityCheckbox>
            <Field
              name="allFacilities"
              label="Include all facilities"
              component={CheckField}
              data-test-id='field-48bc' />
          </FacilityCheckbox>
        </>
      }
    >
      <LocalisedField
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-test-id='translatedtext-mfs6' />
        }
        component={SearchField}
        data-test-id='localisedfield-ufng' />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-test-id='translatedtext-8vca' />
        }
        component={SearchField}
        data-test-id='localisedfield-f6ic' />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-test-id='translatedtext-hljb' />
        }
        component={SearchField}
        data-test-id='localisedfield-p48g' />
      <LocalisedField
        name="requestId"
        label={
          <TranslatedText
            stringId="general.localisedField.requestId.label"
            fallback="Request ID"
            data-test-id='translatedtext-vi6j' />
        }
        component={SearchField}
        data-test-id='localisedfield-l8rh' />
      {!isCompletedTable && (
        <LocalisedField
          name="status"
          label={
            <TranslatedText
              stringId="general.localisedField.status.label"
              fallback="Status"
              data-test-id='translatedtext-rwa6' />
          }
          component={TranslatedSelectField}
          enumValues={IMAGING_REQUEST_STATUS_LABELS}
          transformOptions={options =>
            options.filter(
              option =>
                ![
                  IMAGING_REQUEST_STATUS_TYPES.DELETED,
                  IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
                  IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
                  IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
                ].includes(option.value),
            )
          }
          size="small"
          data-test-id='localisedfield-hu89' />
      )}
      {isCompletedTable && <Spacer />}
      <LocalisedField
        name="imagingType"
        label={
          <TranslatedText
            stringId="general.localisedField.imagingType.label"
            fallback="Type"
            data-test-id='translatedtext-8epy' />
        }
        component={SelectField}
        options={imagingTypeOptions}
        size="small"
        data-test-id='localisedfield-hcre' />
      <LocalisedField
        name="requestedDateFrom"
        label={
          <TranslatedText
            stringId="general.localisedField.requestedDateFrom.label"
            fallback="Requested from"
            data-test-id='translatedtext-4f5y' />
        }
        saveDateAsString
        component={DateField}
        data-test-id='localisedfield-w6u6' />
      <LocalisedField
        name="requestedDateTo"
        label={
          <TranslatedText
            stringId="general.localisedField.requestedDateTo.label"
            fallback="Requested to"
            data-test-id='translatedtext-lvg4' />
        }
        saveDateAsString
        component={DateField}
        data-test-id='localisedfield-nww3' />
      {!isCompletedTable && (
        <LocalisedField
          name="priority"
          label={
            <TranslatedText
              stringId="general.localisedField.priority.label"
              fallback="Priority"
              data-test-id='translatedtext-2ay5' />
          }
          component={SelectField}
          options={imagingPriorities}
          size="small"
          prefix="imaging.property.priority"
          data-test-id='localisedfield-38i7' />
      )}
      {isCompletedTable && (
        <LocalisedField
          name="requestedById"
          label={<TranslatedText
            stringId="general.requestedBy.label"
            fallback="Requested by"
            data-test-id='translatedtext-7opq' />}
          component={AutocompleteField}
          suggester={requesterSuggester}
          size="small"
          data-test-id='localisedfield-6aqf' />
      )}
    </CustomisableSearchBarWithPermissionCheck>
  );
};
