import React from 'react';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { DateField, DisplayIdField, LocalisedField, SelectField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { IMAGING_REQUEST_STATUS_LABELS } from '../../constants';

const STATUS_OPTIONS = Object.values(IMAGING_REQUEST_STATUS_TYPES).map(s => ({
  label: IMAGING_REQUEST_STATUS_LABELS[s],
  value: s,
}));

const URGENCY_OPTIONS = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'Non-urgent', value: 'non-urgent' },
];

export const ImagingRequestsSearchBar = ({ setSearchParameters }) => (
  <CustomisableSearchBar title="Search imaging requests" onSearch={setSearchParameters}>
    <LocalisedField name="firstName" />
    <LocalisedField name="lastName" />
    <DisplayIdField />
    <LocalisedField name="requestId" defaultLabel="Request ID" />
    <LocalisedField name="imagingType" defaultLabel="Type" />
    <LocalisedField
      name="status"
      defaultLabel="Status"
      component={SelectField}
      options={STATUS_OPTIONS}
    />
    <LocalisedField
      name="urgency"
      defaultLabel="Urgency"
      component={SelectField}
      options={URGENCY_OPTIONS}
    />
    <LocalisedField name="requestedDateFrom" defaultLabel="Requested from" component={DateField} />
    <LocalisedField name="requestedDateTo" defaultLabel="Requested to" component={DateField} />
  </CustomisableSearchBar>
);
