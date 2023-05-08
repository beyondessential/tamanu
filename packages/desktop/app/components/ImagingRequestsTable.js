import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { IMAGING_REQUEST_STATUS_CONFIG, IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { SearchTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { PatientNameDisplay } from './PatientNameDisplay';
import { reloadPatient } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';
import { reloadImagingRequest } from '../store';
import { useLocalisation } from '../contexts/Localisation';
import { getImagingRequestType } from '../utils/getImagingRequestType';
import { StatusTag } from './Tag';
import { useImagingRequests } from '../api/queries/useImagingRequests';
import { IMAGING_REQUEST_SEARCH_KEYS } from '../contexts/ImagingRequests';

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
const getPatientDisplayId = ({ encounter }) => encounter.patient.displayId;
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;
const getCompletedDate = ({ results }) => <DateDisplay date={results[0].completedAt} />;

export const ImagingRequestsTable = React.memo(({ encounterId, status = '' }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { loadEncounter } = useEncounter();
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const completedStatus = status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED;
  const { searchParameters } = useImagingRequests(
    completedStatus ? IMAGING_REQUEST_SEARCH_KEYS.COMPLETED : IMAGING_REQUEST_SEARCH_KEYS.ALL,
  );
  const statusFilter = status ? { status } : {};

  const encounterColumns = [
    { key: 'displayId', title: 'Request ID', sortable: false },
    {
      key: 'imagingType',
      title: 'Type',
      accessor: getImagingRequestType(imagingTypes),
    },
    { key: 'requestedDate', title: 'Requested at time', accessor: getDate },
    { key: 'requestedBy.displayName', title: 'Requested by', accessor: getDisplayName },
    ...(status
      ? [
          {
            key: 'results.completedAt',
            title: 'Completed',
            accessor: getCompletedDate,
          },
        ]
      : []),
    { key: 'status', title: 'Status', accessor: getStatus, sortable: false },
  ];

  const globalColumns = [
    { key: 'encounter.patient.displayId', title: 'NHN', accessor: getPatientDisplayId },
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
    <SearchTable
      endpoint={encounterId ? `encounter/${encounterId}/imagingRequests` : 'imagingRequest'}
      columns={encounterId ? encounterColumns : globalColumns}
      noDataMessage="No imaging requests found"
      onRowClick={selectImagingRequest}
      fetchOptions={{ ...searchParameters, ...statusFilter }}
      elevated={false}
      initialSort={{ order: 'desc', orderBy: 'requestedDate' }}
    />
  );
});
