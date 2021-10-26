import React, { useCallback } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { Table, DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { IMAGING_REQUEST_STATUS_LABELS, IMAGING_REQUEST_COLORS } from '../constants';
import { viewImagingRequest } from '../store/imagingRequest';
import { PatientNameDisplay } from './PatientNameDisplay';
import { viewPatientEncounter } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';

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
const getPatientName = ({ encounter }) => <PatientNameDisplay patient={encounter.patient} />;
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getRequestType = ({ imagingType }) => (imagingType || {}).name || 'Unknown';
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;

const encounterColumns = [
  { key: 'id', title: 'Request ID' },
  { key: 'imagingType', title: 'Type', accessor: getRequestType, sortable: false },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'displayName', title: 'Requested by', accessor: getDisplayName, sortable: false },
  { key: 'requestedDate', title: 'Date', accessor: getDate },
];

const globalColumns = [
  { key: 'patient', title: 'Patient', accessor: getPatientName, sortable: false },
  ...encounterColumns,
];

const DumbImagingRequestsTable = React.memo(
  ({
    encounterId,
    onImagingRequestSelect,
    searchParameters 
  }) => {
    const { loadEncounter } = useEncounter();

    const selectImagingRequest = useCallback(async imagingRequest => {
      const { encounter } = imagingRequest;
      if (encounter) {
        await loadEncounter(encounter.id);
      }
      onImagingRequestSelect(imagingRequest);
    }, []);

    return (
      <DataFetchingTable
        endpoint={encounterId ? `encounter/${encounterId}/imagingRequests` : 'imagingRequest'}
        columns={encounterId ? encounterColumns : globalColumns}
        noDataMessage="No imaging requests found"
        onRowClick={selectImagingRequest}
        fetchOptions={searchParameters}
      />
    );
  }
);

export const ImagingRequestsTable = connect(null, dispatch => ({
  onImagingRequestSelect: imagingRequest => {
    const { encounter, id } = imagingRequest;
    if (encounter) {
      dispatch(viewPatientEncounter(encounter.patient.id, encounter.id));
    }

    dispatch(viewImagingRequest(id));
  },
}))(DumbImagingRequestsTable);
