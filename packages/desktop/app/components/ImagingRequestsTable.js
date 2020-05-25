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
const getRequestType = ({ type }) => (type || {}).name || 'Unknown';
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;

const columns = [
  { key: 'id', title: 'Request ID' },
  { key: 'type', title: 'Type', accessor: getRequestType },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'displayName', title: 'Requested by', accessor: getDisplayName },
  { key: 'requestedDate', title: 'Date', accessor: getDate },
];

const DumbImagingRequestsTable = React.memo(({ imagingRequests, onImagingRequestSelect }) => (
  <Table columns={columns} data={imagingRequests} onRowClick={row => onImagingRequestSelect(row)} />
));

export const ImagingRequestsTable = connect(
  null,
  dispatch => ({
    onImagingRequestSelect: imagingRequest => dispatch(viewImagingRequest(imagingRequest.id)),
  }),
)(DumbImagingRequestsTable);

export const DataFetchingImagingRequestsTable = connect(
  null,
  dispatch => ({
    onImagingRequestSelect: imagingRequest => dispatch(viewImagingRequest(imagingRequest.id)),
  }),
)(({ onImagingRequestSelect }) => (
  <DataFetchingTable
    endpoint="imagingRequest"
    columns={columns}
    noDataMessage="No imaging requests found"
    onRowClick={onImagingRequestSelect}
  />
));
