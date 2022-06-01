import React from 'react';

import { DateField, SelectField, StyledSelectField } from './Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { LAB_REQUEST_STATUS_LABELS, LAB_REQUEST_STATUSES } from '../constants';
import { useLabRequest } from '../contexts/LabRequest';

const STATUS_OPTIONS = Object.values(LAB_REQUEST_STATUSES).map(s => ({
  label: LAB_REQUEST_STATUS_LABELS[s],
  value: s,
}));

export const LabRequestsSearchBar = props => {
  const { searchParameters, setSearchParameters } = useLabRequest();
  return (
    <CustomisableSearchBar
      title="Search lab requests"
      fields={[
        ['firstName'],
        ['lastName'],
        ['displayId'],
        ['requestId', { label: 'Request ID' }],
        ['category', { label: 'Type' }],
        ['status', { label: 'Status', component: SelectField, options: STATUS_OPTIONS }],
        ['priority', { label: 'Priority' }],
        ['laboratory', { label: 'Laboratory' }],
        ['requestedDateFrom', { label: 'Requested from', component: DateField }],
        ['requestedDateTo', { label: 'Requested to', component: DateField }],
      ]}
      initialValues={searchParameters}
      onSearch={setSearchParameters}
      {...props}
    />
  );
};
