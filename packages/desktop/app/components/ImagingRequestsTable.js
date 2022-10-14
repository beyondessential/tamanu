import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';

import { IMAGING_REQUEST_STATUS_LABELS } from 'shared/constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { IMAGING_REQUEST_COLORS } from '../constants';
import { PatientNameDisplay } from './PatientNameDisplay';
import { reloadPatient } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';
import { reloadImagingRequest } from '../store';
import { useLocalisation } from '../contexts/Localisation';

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
const getRequestType = imagingTypes => ({ imagingType }) =>
  imagingTypes[imagingType]?.label || 'Unknown'(imagingType || {}).name || 'Unknown';
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} showTime />;

export const ImagingRequestsTable = React.memo(({ encounterId, searchParameters }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { loadEncounter } = useEncounter();
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};

  const encounterColumns = [
    { key: 'id', title: 'Request ID' },
    { key: 'imagingType', title: 'Type', accessor: getRequestType(imagingTypes), sortable: false },
    { key: 'status', title: 'Status', accessor: getStatus },
    { key: 'displayName', title: 'Requested by', accessor: getDisplayName, sortable: false },
    { key: 'requestedDate', title: 'Date & time', accessor: getDate },
  ];

  const globalColumns = [
    { key: 'patient', title: 'Patient', accessor: getPatientName, sortable: false },
    ...encounterColumns,
  ];

  const selectImagingRequest = useCallback(
    async imagingRequest => {
      const { encounter } = imagingRequest;
      const patientId = params.patientId || encounter.patientId;
      if (encounter) {
        await loadEncounter(encounter.id);
        await dispatch(reloadPatient(patientId));
      }
      await dispatch(reloadImagingRequest(imagingRequest.id));
      const category = params.category || 'all';
      dispatch(
        push(
          `/patients/${category}/${patientId}/encounter/${encounterId ||
            encounter.id}/imaging-request/${imagingRequest.id}`,
        ),
      );
    },
    [loadEncounter, dispatch, params.patientId, params.category, encounterId],
  );

  return (
    <DataFetchingTable
      endpoint={encounterId ? `encounter/${encounterId}/imagingRequests` : 'imagingRequest'}
      columns={encounterId ? encounterColumns : globalColumns}
      noDataMessage="No imaging requests found"
      onRowClick={selectImagingRequest}
      fetchOptions={searchParameters}
      elevated={false}
    />
  );
});
