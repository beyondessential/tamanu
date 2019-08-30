import React from 'react';
import styled from 'styled-components';

import { Table } from './Table';
import { DateDisplay } from './DateDisplay';

import { LAB_REQUEST_STATUSES } from '../constants';

const StatusLabel = styled.div`
  background: #fff;
  border-radius: 0.3rem;
  padding: 0.3rem;
`;

const StatusDisplay = React.memo(({ status }) => {
  switch (status) {
    case LAB_REQUEST_STATUSES.RECEPTION_PENDING:
      return <StatusLabel>Reception pending</StatusLabel>;
    case LAB_REQUEST_STATUSES.RESULTS_PENDING:
      return <StatusLabel>Results pending</StatusLabel>;
    case LAB_REQUEST_STATUSES.TO_BE_VERIFIED:
      return <StatusLabel>To be verified</StatusLabel>;
    case LAB_REQUEST_STATUSES.VERIFIED:
      return <StatusLabel>Verified</StatusLabel>;
    case LAB_REQUEST_STATUSES.PUBLISHED:
      return <StatusLabel>Published</StatusLabel>;
    default:
      return <StatusLabel>Unknown</StatusLabel>;
  }
});

const getDisplayName = ({ requestedBy }) => (requestedBy || {}).displayName || 'Unknown';
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getRequestType = ({ category }) => (category || {}).name || 'Unknown';
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;

const columns = [
  { key: '_id', title: 'Request ID' },
  { key: 'labRequestType', title: 'Type', accessor: getRequestType },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'displayName', title: 'Requested by', accessor: getDisplayName },
  { key: 'requestedDate', title: 'Date', accessor: getDate },
];

export const LabRequestsTable = React.memo(({ labs }) => <Table columns={columns} data={labs} />);
