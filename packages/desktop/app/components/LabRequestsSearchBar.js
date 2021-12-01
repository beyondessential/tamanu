import React from 'react';

import { DateField, StyledSelectField } from './Field';
import { CustomisablePatientSearchBar } from '../views/patients/components/PatientSearchBar';
import { LAB_REQUEST_STATUS_LABELS, LAB_REQUEST_STATUSES } from '../constants';
import { useLabRequest } from '../contexts/LabRequest';

const STATUS_OPTIONS = Object.values(LAB_REQUEST_STATUSES).map(s => ({
  label: LAB_REQUEST_STATUS_LABELS[s],
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

export const LabRequestsSearchBar = props => {
  const { searchParameters, setSearchParameters } = useLabRequest();
  return (
    <CustomisablePatientSearchBar
      title="Search lab requests"
      fields={[
        ['firstName'],
        ['lastName'],
        ['displayId'],
        ['requestId', { placeholder: 'Request ID' }],
        ['category', { placeholder: 'Type' }],
        ['status', { placeholder: 'Status', component: StatusField }],
        ['priority', { placeholder: 'Priority' }],
        ['laboratory', { placeholder: 'Laboratory' }],
        ['requestedDateFrom', { placeholder: 'Requested from', component: DateField }],
        ['requestedDateTo', { placeholder: 'Requested to', component: DateField }],
      ]}
      initialValues={searchParameters}
      onSearch={setSearchParameters}
      {...props}
    />
  );
};
