import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { useParams } from 'react-router-dom';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { IMAGING_REQUEST_STATUS_LABELS, IMAGING_REQUEST_COLORS } from '../constants';
import { viewImagingRequest } from '../store/imagingRequest';
import { PatientNameDisplay } from './PatientNameDisplay';
import { reloadPatient } from '../store/patient';
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

export const ImagingRequestsTable = React.memo(({ encounterId, searchParameters }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { loadEncounter } = useEncounter();

  const selectImagingRequest = useCallback(
    async imagingRequest => {
      const { encounter } = imagingRequest;
      if (encounter) {
        await loadEncounter(encounter.id);
      }
      dispatch(reloadPatient(params.patientId || encounter.patientId));
      dispatch(
        viewImagingRequest(
          params.patientId || encounter.patientId,
          params.encounterId || encounter.id,
          imagingRequest.id,
        ),
      );
    },
    [loadEncounter, dispatch, params.patientId, params.encounterId],
  );

  return (
    <DataFetchingTable
      endpoint={encounterId ? `encounter/${encounterId}/imagingRequests` : 'imagingRequest'}
      columns={encounterId ? encounterColumns : globalColumns}
      noDataMessage="No imaging requests found"
      onRowClick={selectImagingRequest}
      fetchOptions={searchParameters}
    />
  );
});
