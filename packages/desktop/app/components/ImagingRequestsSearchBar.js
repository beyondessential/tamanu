import React from 'react';

import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { DateField, StyledSelectField } from './Field';
import { CustomisablePatientSearchBar } from '../views/patients/components/PatientSearchBar';
import { IMAGING_REQUEST_STATUS_LABELS } from '../constants';

const STATUS_OPTIONS = Object.values(IMAGING_REQUEST_STATUS_TYPES).map(s => ({
  label: IMAGING_REQUEST_STATUS_LABELS[s],
  value: s,
}));

const URGENCY_OPTIONS = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'Non-urgent', value: 'non-urgent' },
];

export const ImagingRequestsSearchBar = ({ setSearchParameters }) => (
  <CustomisablePatientSearchBar
    title="Search imaging requests"
    fields={[
      ['firstName'],
      ['lastName'],
      ['displayId'],
      ['requestId', { placeholder: 'Request ID' }],
      ['imagingType', { placeholder: 'Type' }],
      ['status', { placeholder: 'Status', component: StyledSelectField, options: STATUS_OPTIONS }],
      [
        'urgency',
        { placeholder: 'Urgency', component: StyledSelectField, options: URGENCY_OPTIONS },
      ],
      ['requestedDateFrom', { placeholder: 'Requested from', component: DateField }],
      ['requestedDateTo', { placeholder: 'Requested to', component: DateField }],
    ]}
    onSearch={setSearchParameters}
  />
);
