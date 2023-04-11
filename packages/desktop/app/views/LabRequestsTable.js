import React from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { SearchTable } from '../components';
import { reloadPatient } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';
import { useLabRequest } from '../contexts/LabRequest';
import {
  getPatientName,
  getPatientDisplayId,
  getStatus,
  getRequestType,
  getPriority,
  getDateTime,
  getRequestId,
} from '../utils/lab';

const columns = [
  {
    key: 'displayId',
    accessor: getPatientDisplayId,
  },
  {
    key: 'patientName',
    title: 'Patient',
    accessor: getPatientName,
    maxWidth: 200,
  },
  { key: 'requestId', title: 'Test ID', accessor: getRequestId },
  { key: 'testCategory', title: 'Test category', accessor: getRequestType },
  { key: 'labTestPanelName', title: 'Panel' },
  { key: 'requestedDate', title: 'Requested at time', accessor: getDateTime },
  { key: 'priority', title: 'Priority', accessor: getPriority },
  { key: 'status', title: 'Status', accessor: getStatus, maxWidth: 200 },
];

export const LabRequestsTable = () => {
  const dispatch = useDispatch();
  const { loadEncounter } = useEncounter();
  const { loadLabRequest, searchParameters } = useLabRequest();

  const selectLab = async lab => {
    await loadEncounter(lab.encounterId);

    if (lab.patientId) {
      await dispatch(reloadPatient(lab.patientId));
    }
    const { patientId } = lab;
    await loadLabRequest(lab.id);
    dispatch(push(`/patients/all/${patientId}/encounter/${lab.encounterId}/lab-request/${lab.id}`));
  };

  return (
    <SearchTable
      endpoint="labRequest"
      columns={columns}
      noDataMessage="No lab requests found"
      onRowClick={selectLab}
      fetchOptions={searchParameters}
      initialSort={{ order: 'desc', orderBy: 'requestedDate' }}
    />
  );
};
