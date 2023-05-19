import React from 'react';
import styled from 'styled-components';
import { IMAGING_REQUEST_STATUS_OPTIONS } from '../../constants';
import { DateField, LocalisedField, SelectField, Field, CheckField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useLocalisation } from '../../contexts/Localisation';

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

export const ImagingRequestsSearchBar = ({ searchParameters, setSearchParameters }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingPriorities = getLocalisation('imagingPriorities') || [];

  const imagingTypeOptions = Object.entries(imagingTypes).map(([key, val]) => ({
    label: val.label,
    value: key,
  }));

  return (
    <CustomisableSearchBar
      title="Search imaging requests"
      onSearch={setSearchParameters}
      initialValues={{ displayIdExact: true, ...searchParameters }}
    >
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="displayId" />
      <LocalisedField name="requestId" defaultLabel="Request ID" />
      <LocalisedField
        name="imagingType"
        defaultLabel="Type"
        component={SelectField}
        options={imagingTypeOptions}
      />
      <LocalisedField
        name="status"
        defaultLabel="Status"
        component={SelectField}
        options={IMAGING_REQUEST_STATUS_OPTIONS}
      />
      <LocalisedField
        name="priority"
        defaultLabel="Priority"
        component={SelectField}
        options={imagingPriorities}
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
      <FacilityCheckbox>
        <Field name="allFacilities" label="Include all facilities" component={CheckField} />
      </FacilityCheckbox>
    </CustomisableSearchBar>
  );
};
