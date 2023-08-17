import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { IMAGING_REQUEST_STATUS_CONFIG, IMAGING_TABLE_VERSIONS } from '@tamanu/constants';
import { SearchTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { PatientNameDisplay } from './PatientNameDisplay';
import { reloadPatient } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';
import { reloadImagingRequest } from '../store';
import { useLocalisation } from '../contexts/Localisation';
import { getImagingRequestType } from '../utils/getImagingRequestType';
import { TableCellTag } from './Tag';
import { useImagingRequests } from '../contexts/ImagingRequests';
import { capitaliseFirstLetter } from '../utils/capitalise';

const StatusDisplay = React.memo(({ status }) => {
  const { background, color, label } = IMAGING_REQUEST_STATUS_CONFIG[status];
  return (
    <TableCellTag $background={background} $color={color}>
      {label}
    </TableCellTag>
  );
});

const getDisplayName = ({ requestedBy }) => (requestedBy || {}).displayName || 'Unknown';
const getPatientName = ({ encounter }) => <PatientNameDisplay patient={encounter.patient} />;
const getPatientDisplayId = ({ encounter }) => encounter.patient.displayId;
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} timeOnlyTooltip />;
const getCompletedDate = ({ completedAt }) => <DateDisplay date={completedAt} timeOnlyTooltip />;
const getPriority = ({ priority }) => capitaliseFirstLetter(priority || 'Unknown');

export const ImagingRequestsTable = React.memo(({ encounterId, memoryKey, statuses = [] }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { loadEncounter } = useEncounter();
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const { searchParameters } = useImagingRequests(memoryKey);
  const isCompletedTable = memoryKey === IMAGING_TABLE_VERSIONS.COMPLETED.memoryKey;

  const statusFilter = statuses.length > 0 ? { status: statuses } : {};

  const encounterColumns = [
    { key: 'displayId', title: 'Request ID', sortable: false },
    {
      key: 'imagingType',
      title: 'Type',
      accessor: getImagingRequestType(imagingTypes),
    },
    { key: 'requestedDate', title: 'Requested at time', accessor: getDate },
    { key: 'requestedBy.displayName', title: 'Requested by', accessor: getDisplayName },
    ...(isCompletedTable
      ? [
          {
            key: 'completedAt',
            title: 'Completed',
            accessor: getCompletedDate,
          },
        ]
      : [
          {
            key: 'priority',
            title: 'Priority',
            accessor: getPriority,
          },
        ]),
    { key: 'status', title: 'Status', accessor: getStatus },
  ];

  const globalColumns = [
    {
      key: 'encounter.patient.displayId',
      title: 'NHN',
      accessor: getPatientDisplayId,
      sortable: false,
    },
    { key: 'patient', title: 'Patient', accessor: getPatientName, sortable: false },
    ...encounterColumns,
  ];

  const selectImagingRequest = useCallback(
    async imagingRequest => {
      const { encounter } = imagingRequest;
      const patientId = params.patientId || encounter.patient.id;
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

  const globalImagingRequestsFetchOptions = { ...statusFilter, ...searchParameters };

  return (
    <SearchTable
      autoRefresh={!encounterId}
      endpoint={encounterId ? `encounter/${encounterId}/imagingRequests` : 'imagingRequest'}
      columns={encounterId ? encounterColumns : globalColumns}
      noDataMessage="No imaging requests found"
      onRowClick={selectImagingRequest}
      fetchOptions={encounterId ? undefined : globalImagingRequestsFetchOptions}
      elevated={false}
      initialSort={{
        order: 'desc',
        orderBy: isCompletedTable ? 'completedAt' : 'requestedDate',
      }}
    />
  );
});
