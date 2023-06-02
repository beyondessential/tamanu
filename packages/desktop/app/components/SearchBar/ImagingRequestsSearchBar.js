import React from 'react';
import styled from 'styled-components';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
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
import { useImagingRequests, IMAGING_REQUEST_SEARCH_KEYS } from '../../contexts/ImagingRequests';
import { useAdvancedFields } from './useAdvancedFields';

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

const Spacer = styled.div`
  width: 100%;
`;

const BASE_ADVANCED_FIELDS = ['allFacilities'];
const COMPLETED_ADVANCED_FIELDS = [
  ...BASE_ADVANCED_FIELDS,
  'locationGroupId',
  'departmentId',
  'completedAt',
];
const ALL_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS];

export const ImagingRequestsSearchBar = ({ memoryKey, statuses = [] }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingPriorities = getLocalisation('imagingPriorities') || [];
  const areaSuggester = useSuggester('locationGroup');
  const departmentSuggester = useSuggester('department');
  const requesterSuggester = useSuggester('practitioner');
  const completedStatus = status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED;

  const { searchParameters, setSearchParameters } = useImagingRequests(
    completedStatus ? IMAGING_REQUEST_SEARCH_KEYS.COMPLETED : IMAGING_REQUEST_SEARCH_KEYS.ALL,
  );

  const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
    completedStatus ? COMPLETED_ADVANCED_FIELDS : ALL_ADVANCED_FIELDS,
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
      staticValues={{ displayIdExact: true }}
      hiddenFields={
        <>
          {memoryKey !== IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && (
            <>
              <LocalisedField
                name="requestedById"
                defaultLabel="Requested by"
                saveDateAsString
                component={AutocompleteField}
                suggester={requesterSuggester}
              />
            </>
          )}
          <LocalisedField
            name="locationGroupId"
            defaultLabel="Area"
            component={AutocompleteField}
            suggester={areaSuggester}
            size="small"
          />
          <LocalisedField
            name="departmentId"
            defaultLabel="Department"
            component={AutocompleteField}
            suggester={departmentSuggester}
            size="small"
          />
          {memoryKey === IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && (
            <>
              <LocalisedField
                name="completedAt"
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
      <LocalisedField name="displayId" component={SearchField} />
      <LocalisedField name="firstName" component={SearchField} />
      <LocalisedField name="lastName" component={SearchField} />
      <LocalisedField name="requestId" defaultLabel="Request ID" component={SearchField} />
      {memoryKey !== IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && (
        <LocalisedField
          name="status"
          defaultLabel="Status"
          component={SelectField}
          options={IMAGING_REQUEST_STATUS_OPTIONS.filter(
            ({ value }) => value !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          )}
          size="small"
        />
      )}
      {memoryKey === IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && <Spacer />}
      <LocalisedField
        name="imagingType"
        defaultLabel="Type"
        component={SelectField}
        options={imagingTypeOptions}
        size="small"
      />
      <LocalisedField
        name="requestedDateFrom"
        defaultLabel="Requested from"
        saveDateAsString
        component={DateField}
      />
      <LocalisedField
        name="requestedDateTo"
        defaultLabel="Requested to"
        saveDateAsString
        component={DateField}
      />
      {memoryKey !== IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && (
        <LocalisedField
          name="priority"
          defaultLabel="Priority"
          component={SelectField}
          options={imagingPriorities}
          size="small"
        />
      )}
      {memoryKey === IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && (
        <LocalisedField
          name="requestedById"
          defaultLabel="Requested by"
          component={AutocompleteField}
          suggester={requesterSuggester}
          size="small"
        />
      )}
    </CustomisableSearchBar>
  );
};
