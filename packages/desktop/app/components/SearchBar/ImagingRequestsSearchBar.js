import React, { useState } from 'react';
import { IMAGING_REQUEST_STATUS_OPTIONS } from '../../constants';
import {
  DateField,
  LocalisedField,
  SelectField,
  AutocompleteField,
  DynamicSelectField,
} from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';
import { useSuggester } from '../../api';

export const ImagingRequestsSearchBar = ({
  searchParameters,
  setSearchParameters,
  statusFilterTable,
}) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingPriorities = getLocalisation('imagingPriorities') || [];
  const areaSuggester = useSuggester('locationGroup') || [];
  const departmentSuggester = useSuggester('department') || [];
  const requesterSuggester = useSuggester('practitioner') || [];

  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

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
      initialValues={searchParameters}
      staticValues={{ displayIdExact: true }}
      hiddenFields={
        statusFilterTable && (
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
              size="small"
            />
          </>
        )
      }
    >
      <LocalisedField name="displayId" />
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="requestId" defaultLabel="Request ID" />
      {!statusFilterTable && (
        <LocalisedField
          name="status"
          defaultLabel="Status"
          component={SelectField}
          options={IMAGING_REQUEST_STATUS_OPTIONS}
        />
      )}
      <LocalisedField
        name="imagingType"
        defaultLabel="Type"
        component={SelectField}
        options={imagingTypeOptions}
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
      {!statusFilterTable && (
        <LocalisedField
          name="priority"
          defaultLabel="Priority"
          component={SelectField}
          options={imagingPriorities}
        />
      )}
      {statusFilterTable && (
        <LocalisedField
          name="requestedBy"
          defaultLabel="Requested by"
          component={DynamicSelectField}
          suggester={requesterSuggester}
        />
      )}
    </CustomisableSearchBar>
  );
};
