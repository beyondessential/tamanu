import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { IMAGING_REQUEST_STATUS_CONFIG } from 'shared/constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { PatientNameDisplay } from './PatientNameDisplay';
import { useEncounter } from '../contexts/Encounter';
import { reloadImagingRequest } from '../store';
import { useLocalisation } from '../contexts/Localisation';
import { StatusTag } from './Tag';
import { usePatient } from '../contexts/Patient';

const StatusDisplay = React.memo(({ status }) => {
  const { background, color, label } = IMAGING_REQUEST_STATUS_CONFIG[status];
  return (
    <StatusTag $background={background} $color={color}>
      {label}
    </StatusTag>
  );
});

const getDisplayName = ({ requestedBy }) => (requestedBy || {}).displayName || 'Unknown';
const getPatientName = ({ encounter }) => <PatientNameDisplay patient={encounter.patient} />;
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getRequestType = imagingTypes => ({ imagingType }) =>
  imagingTypes[imagingType]?.label || 'Unknown';
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} showTime />;

export const ImagingRequestsTable = React.memo(({ encounterId, searchParameters }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { loadPatient } = usePatient();
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
        await loadPatient(patientId);
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
