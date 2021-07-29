import React from 'react';
import styled from 'styled-components';

import { DateField, SelectField } from './Field';
import { CustomisablePatientSearchBar } from '../views/patients/components/PatientSearchBar';
import { LAB_REQUEST_STATUS_LABELS, LAB_REQUEST_STATUSES } from '../constants';

const StyledSelectField = styled(SelectField)`
  .styled-select-container {
    padding: 8px 8px 2px 8px;
    border-radius: 0 3px 3px 0;
    border: 1px solid #dedede;
  }

  .styled-select__control,
  .styled-select__control--is-focused,
  .styled-select__control--menu-is-open {
    border: none;
    box-shadow: none;
  }
`;

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

export const LabRequestsSearchBar = props => (
  <CustomisablePatientSearchBar
    title="Search Lab Requests"
    fields={[
      ['displayId'],
      ['requestId', { placeholder: 'Request ID' }],
      ['category', { placeholder: 'Type' }],
      ['status', { placeholder: 'Status', component: StatusField }],
      ['priority', { placeholder: 'Priority' }],
      ['laboratory', { placeholder: 'Laboratory' }],
      ['requestedDateFrom', { placeholder: 'Requested from', component: DateField }],
      ['requestedDateTo', { placeholder: 'Requested to', component: DateField }],
    ]}
    {...props}
  />
);
