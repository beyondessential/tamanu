import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { DataFetchingTable } from '../../components';
import { reloadPatient } from '../../store/patient';
import { useLabRequest } from '../../contexts/LabRequest';
import {
  getRequestedBy,
  getStatus,
  getRequestType,
  getPriority,
  getDateWithTimeTooltip,
  getRequestId,
} from '../../utils/lab';

const columns = [
  { key: 'requestId', title: 'Test ID', sortable: false, accessor: getRequestId },
  { key: 'category.name', title: 'Test category', accessor: getRequestType },
  { key: 'requestedDate', title: 'Requested at time', accessor: getDateWithTimeTooltip },
  { key: 'displayName', title: 'Requested by', accessor: getRequestedBy, sortable: false },
  { key: 'priority.name', title: 'Priority', accessor: getPriority },
  { key: 'status', title: 'Status', accessor: getStatus, maxWidth: 200 },
];

export const EncounterLabRequestsTable = React.memo(({ encounterId }) => {
  const { patientId, category } = useParams();
  const dispatch = useDispatch();
  const { loadLabRequest } = useLabRequest();

  const selectLab = async lab => {
    if (lab.patientId) await dispatch(reloadPatient(lab.patientId));
    await loadLabRequest(lab.id);
    dispatch(
      push(`/patients/${category}/${patientId}/encounter/${encounterId}/lab-request/${lab.id}`),
    );
  };

  return (
    <DataFetchingTable
      endpoint={`encounter/${encounterId}/labRequests`}
      columns={columns}
      noDataMessage="No lab requests found"
      onRowClick={selectLab}
      initialSort={{ order: 'desc', orderBy: 'requestedDate' }}
    />
  );
});
