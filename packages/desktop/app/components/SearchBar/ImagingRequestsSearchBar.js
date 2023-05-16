import React, { useState } from 'react';
import styled from 'styled-components';
import { Op } from 'sequelize';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { IMAGING_REQUEST_STATUS_OPTIONS } from '../../constants';

import {
  DateField,
  LocalisedField,
  SelectField,
  AutocompleteField,
  DynamicSelectField,
  Field,
  CheckField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';
import { useSuggester } from '../../api';
import { useImagingRequests, IMAGING_REQUEST_SEARCH_KEYS } from '../../contexts/ImagingRequests';

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

const ADVANCED_FIELDS = ['locationGroupId', 'departmentId', 'completedAt'];

const useAdvancedFields = (advancedFields, searchMemoryKey) => {
  const { searchParameters, setSearchParameters } = useImagingRequests(searchMemoryKey);

  // If one of the advanced fields is filled in when landing on the screen,
  // show the advanced fields section
  const defaultIsOpen = Object.keys(searchParameters).some(searchKey =>
    advancedFields.includes(searchKey),
  );
  const [showAdvancedFields, setShowAdvancedFields] = useState(defaultIsOpen);
  return { showAdvancedFields, setShowAdvancedFields, searchParameters, setSearchParameters };
};

export const ImagingRequestsSearchBar = ({ memoryKey, statuses = [] }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingPriorities = getLocalisation('imagingPriorities') || [];
  const areaSuggester = useSuggester('locationGroup') || [];
  const departmentSuggester = useSuggester('department') || [];
  const requesterSuggester = useSuggester('practitioner') || [];

  const {
    showAdvancedFields,
    setShowAdvancedFields,
    searchParameters,
    setSearchParameters,
  } = useAdvancedFields(ADVANCED_FIELDS, memoryKey);
  const statusFilter = statuses.length > 0 ? { status: statuses } : {};

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
      initialValues={{ ...searchParameters, ...statusFilter }}
      staticValues={{ displayIdExact: true }}
      hiddenFields={
        memoryKey === IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && (
          <>
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
            <LocalisedField
              name="completedAt"
              defaultLabel="Completed"
              saveDateAsString
              component={DateField}
            />
          </>
        )
      }
    >
      <LocalisedField name="displayId" />
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="requestId" defaultLabel="Request ID" />
      {memoryKey !== IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && (
        <LocalisedField
          name="status"
          defaultLabel="Status"
          component={SelectField}
          options={IMAGING_REQUEST_STATUS_OPTIONS}
          size="small"
        />
      )}
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
        />
      )}
      {memoryKey === IMAGING_REQUEST_SEARCH_KEYS.COMPLETED && (
        <LocalisedField
          name="requestedById"
          defaultLabel="Requested by"
          component={DynamicSelectField}
          suggester={requesterSuggester}
          size="small"
        />
      )}
      <FacilityCheckbox>
        <Field name="allFacilities" label="Include all facilities" component={CheckField} />
      </FacilityCheckbox>
    </CustomisableSearchBar>
  );
};
