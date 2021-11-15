import React from 'react';

import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { DateField, StyledSelectField } from './Field';
import { CustomisablePatientSearchBar } from '../views/patients/components/PatientSearchBar';
import { IMAGING_REQUEST_STATUS_LABELS } from '../constants';

const STATUS_OPTIONS = Object.values(IMAGING_REQUEST_STATUS_TYPES).map(s => ({
  label: IMAGING_REQUEST_STATUS_LABELS[s],
  value: s,
}));

const StatusField = props => (
  <StyledSelectField
    {...props}
    className="styled-select-container"
    classNamePrefix="styled-select"
    options={STATUS_OPTIONS}
  />
);

const URGENCY_OPTIONS = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'Non-urgent', value: 'non-urgent' },
];

const UrgencyField = props => (
  <StyledSelectField
    {...props}
    className="styled-select-container"
    classNamePrefix="styled-select"
    options={URGENCY_OPTIONS}
  />
);

export const ImagingRequestsSearchBar = ({ setSearchParameters }) => {
  return (
    <CustomisablePatientSearchBar
      title="Search imaging requests"
      fields={[
        ['firstName'],
        ['lastName'],
        ['displayId'],
        ['requestId', { placeholder: 'Request ID' }],
        ['imagingType', { placeholder: 'Type' }],
        ['status', { placeholder: 'Status', component: StatusField }],
        ['urgency', { placeholder: 'Urgency', component: UrgencyField }],
        ['requestedDateFrom', { placeholder: 'Requested from', component: DateField }],
        ['requestedDateTo', { placeholder: 'Requested to', component: DateField }],
      ]}
      initialValues={{}}
      onSearch={setSearchParameters}
    />
  );
};
