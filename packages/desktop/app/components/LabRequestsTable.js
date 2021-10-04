import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { DataFetchingTable } from './Table';

import { viewPatientEncounter } from '../store/patient';
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

const DumbLabRequestsTable = React.memo(({ encounterId, viewPatient }) => {
  const { loadEncounter } = useEncounter();
  const { loadLabRequest, searchParameters } = useLabRequest();
  const selectLab = useCallback(async lab => {
    if (!encounterId) {
      // no encounter, likely on the labs page
      await loadEncounter(lab.encounterId);
    }
    if (lab.patientId) viewPatient(lab);
    loadLabRequest(lab.id);
  }, []);

  return (
    <DataFetchingTable
      endpoint={encounterId ? `encounter/${encounterId}/labRequests` : 'labRequest'}
      columns={encounterId ? encounterColumns : globalColumns}
      noDataMessage="No lab requests found"
      onRowClick={selectLab}
      fetchOptions={searchParameters}
    />
  );
});

export const LabRequestsTable = connect(null, dispatch => ({
  viewPatient: lab => dispatch(viewPatientEncounter(lab.patientId, lab.encounterId)),
}))(DumbLabRequestsTable);
