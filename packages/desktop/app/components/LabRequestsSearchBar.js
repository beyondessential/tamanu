import React from 'react';
import { CustomisablePatientSearchBar } from '../views/patients/components/PatientSearchBar';
import { DateField } from './Field';

export const LabRequestsSearchBar = props => (
  <CustomisablePatientSearchBar
    title="Search Lab Requests"
    fields={[
      ['displayId'],
      ['requestId', { placeholder: 'Request ID' }],
      ['category', { placeholder: 'Type' }],
      ['status', { placeholder: 'Status' }],
      ['priority', { placeholder: 'Priority' }],
      ['laboratory', { placeholder: 'Laboratory' }],
      ['requestedDateFrom', { placeholder: 'Requested from', component: DateField }],
      ['requestedDateTo', { placeholder: 'Requested to', component: DateField }],
    ]}
    {...props}
  />
);
