import React from 'react';

import { DateField, StyledSelectField } from './Field';
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
        ['requestId', { placeholder: 'Request ID' }],
        ['category', { placeholder: 'Type' }],
        [
          'status',
          { placeholder: 'Status', component: StyledSelectField, options: STATUS_OPTIONS },
        ],
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
