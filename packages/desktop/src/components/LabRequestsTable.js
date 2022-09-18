import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';

import { DataFetchingTable } from './Table';

import { reloadPatient } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';
import { useLabRequest } from '../contexts/LabRequest';

import {
  getRequestedBy,
  getPatientName,
  getPatientDisplayId,
  getStatus,
  getRequestType,
  getPriority,
  getDate,
  getRequestId,
  getLaboratory,
} from '../utils/lab';

const encounterColumns = [
  { key: 'requestId', title: 'Request ID', sortable: false, accessor: getRequestId },
  { key: 'labRequestType', title: 'Type', accessor: getRequestType, sortable: false },
  { key: 'status', title: 'Status', accessor: getStatus, sortable: false },
  { key: 'displayName', title: 'Requested by', accessor: getRequestedBy, sortable: false },
  { key: 'requestedDate', title: 'Date', accessor: getDate, sortable: false },
  { key: 'priority', title: 'Priority', accessor: getPriority },
  { key: 'laboratory', title: 'Laboratory', accessor: getLaboratory },
];

const globalColumns = [
  { key: 'patient', title: 'Patient', accessor: getPatientName, sortable: false },
  {
    key: 'displayId',
    accessor: getPatientDisplayId,
    sortable: false,
  },
  ...encounterColumns,
];

export const LabRequestsTable = React.memo(({ encounterId }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { loadEncounter } = useEncounter();
  const { loadLabRequest, searchParameters } = useLabRequest();
  const selectLab = useCallback(
    async lab => {
      if (!encounterId) {
        // no encounter, likely on the labs page
        await loadEncounter(lab.encounterId);
      }
      if (lab.patientId) await dispatch(reloadPatient(lab.patientId));
      const patientId = params.patientId || lab.patientId;
      const category = params.category || 'all';
      await loadLabRequest(lab.id);
      dispatch(
        push(
          `/patients/${category}/${patientId}/encounter/${encounterId ||
            lab.encounterId}/lab-request/${lab.id}`,
        ),
      );
    },
    [encounterId, dispatch, loadEncounter, loadLabRequest, params.patientId, params.category],
  );

  return (
    <DataFetchingTable
      endpoint={encounterId ? `encounter/${encounterId}/labRequests` : 'labRequest'}
      columns={encounterId ? encounterColumns : globalColumns}
      noDataMessage="No lab requests found"
      onRowClick={selectLab}
      fetchOptions={searchParameters}
      elevated={false}
    />
  );
});
