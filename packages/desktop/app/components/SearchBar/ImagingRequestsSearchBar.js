import React from 'react';
import styled from 'styled-components';
import { IMAGING_TABLE_VERSIONS, IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/shared/constants';
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
  const areaSuggester = useSuggester('facilityLocationGroup');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
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
      staticValues={{ displayIdExact: true }}
      hiddenFields={
        <>
          {!isCompletedTable && (
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
          {isCompletedTable && (
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
      {!isCompletedTable && (
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
      {isCompletedTable && <Spacer />}
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
      {!isCompletedTable && (
        <LocalisedField
          name="priority"
          defaultLabel="Priority"
          component={SelectField}
          options={imagingPriorities}
          size="small"
        />
      )}
      {isCompletedTable && (
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
