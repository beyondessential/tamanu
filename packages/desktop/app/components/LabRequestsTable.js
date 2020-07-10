import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { LAB_REQUEST_STATUS_LABELS, LAB_REQUEST_COLORS } from '../constants';
import { viewLab } from '../store/labRequest';

const StatusLabel = styled.div`
  background: ${p => p.color};
  border-radius: 0.3rem;
  padding: 0.3rem;
`;

const StatusDisplay = React.memo(({ status }) => (
  <StatusLabel color={LAB_REQUEST_COLORS[status] || LAB_REQUEST_COLORS.unknown}>
    {LAB_REQUEST_STATUS_LABELS[status] || 'Unknown'}
  </StatusLabel>
));

const getDisplayName = ({ requestedBy }) => (requestedBy || {}).displayName || 'Unknown';
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getRequestType = ({ category }) => (category || {}).name || 'Unknown';
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;

const columns = [
  { key: 'id', title: 'Request ID' },
  { key: 'labRequestType', title: 'Type', accessor: getRequestType },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'displayName', title: 'Requested by', accessor: getDisplayName },
  { key: 'requestedDate', title: 'Date', accessor: getDate },
];

const DumbLabRequestsTable = React.memo(({ encounterId, onLabSelect }) => (
  <DataFetchingTable
    endpoint={encounterId ? `encounter/${encounterId}/labRequests` : 'labRequest'}
    columns={columns}
    noDataMessage="No lab requests found"
    onRowClick={row => onLabSelect(row)}
  />
));

export const LabRequestsTable = connect(null, dispatch => ({
  onLabSelect: lab => dispatch(viewLab(lab.id)),
}))(DumbLabRequestsTable);
