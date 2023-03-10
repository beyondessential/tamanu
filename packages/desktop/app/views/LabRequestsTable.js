import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { DataFetchingTable } from '../components';
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
  getDateTime,
  getRequestId,
} from '../utils/lab';

const columns = [
  {
    key: 'displayId',
    accessor: getPatientDisplayId,
    sortable: false,
  },
  { key: 'patient', title: 'Patient', accessor: getPatientName, sortable: false },
  { key: 'requestId', title: 'Test ID', sortable: false, accessor: getRequestId },
  { key: 'category.name', title: 'Test category', accessor: getRequestType },
  { key: 'requestedDate', title: 'Requested at time', accessor: getDateTime },
  { key: 'displayName', title: 'Requested by', accessor: getRequestedBy, sortable: false },
  { key: 'priority.name', title: 'Priority', accessor: getPriority },
  { key: 'status', title: 'Status', accessor: getStatus, maxWidth: 200 },
];

const StyledTable = styled(DataFetchingTable)`
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  box-shadow: none;
`;

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
    <StyledTable
      endpoint="labRequest"
      columns={columns}
      noDataMessage="No lab requests found"
      onRowClick={selectLab}
      fetchOptions={searchParameters}
      initialSort={{ order: 'desc', orderBy: 'requestedDate' }}
    />
  );
};
