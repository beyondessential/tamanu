import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { IMAGING_REQUEST_STATUS_CONFIG } from 'shared/constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { PatientNameDisplay } from './PatientNameDisplay';
import { reloadPatient } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';
import { reloadImagingRequest } from '../store';
import { useLocalisation } from '../contexts/Localisation';
import { getImagingRequestType } from '../utils/getImagingRequestType';
import { TableCellTag } from './Tag';

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
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} showTime />;

export const ImagingRequestsTable = React.memo(({ encounterId, searchParameters }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { loadEncounter } = useEncounter();
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};

  const encounterColumns = [
    { key: 'id', title: 'Request ID' },
    {
      key: 'imagingType',
      title: 'Type',
      accessor: getImagingRequestType(imagingTypes),
      sortable: false,
    },
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
