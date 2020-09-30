import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { Table, DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { IMAGING_REQUEST_STATUS_LABELS, IMAGING_REQUEST_COLORS } from '../constants';
import { viewImagingRequest } from '../store/imagingRequest';

const StatusLabel = styled.div`
  background: ${p => p.color};
  border-radius: 0.3rem;
  padding: 0.3rem;
`;

const StatusDisplay = React.memo(({ status }) => (
  <StatusLabel color={IMAGING_REQUEST_COLORS[status] || IMAGING_REQUEST_COLORS.unknown}>
    {IMAGING_REQUEST_STATUS_LABELS[status] || 'Unknown'}
  </StatusLabel>
));

const getDisplayName = ({ requestedBy }) => (requestedBy || {}).displayName || 'Unknown';
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getRequestType = ({ imagingType }) => (imagingType || {}).name || 'Unknown';
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;

const columns = [
  { key: 'id', title: 'Request ID' },
  { key: 'imagingType', title: 'Type', accessor: getRequestType, sortable: false },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'displayName', title: 'Requested by', accessor: getDisplayName, sortable: false },
  { key: 'requestedDate', title: 'Date', accessor: getDate },
];

const DumbImagingRequestsTable = React.memo(({ encounterId, onImagingRequestSelect }) => (
  <DataFetchingTable
    endpoint={encounterId ? `encounter/${encounterId}/imagingRequests` : 'imagingRequest'}
    columns={columns}
    noDataMessage="No imaging requests found"
    onRowClick={onImagingRequestSelect}
  />
));

export const ImagingRequestsTable = connect(null, dispatch => ({
  onImagingRequestSelect: imagingRequest => dispatch(viewImagingRequest(imagingRequest.id)),
}))(DumbImagingRequestsTable);
