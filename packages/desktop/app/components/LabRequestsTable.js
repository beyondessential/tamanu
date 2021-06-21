import React, { useCallback } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { LAB_REQUEST_STATUS_LABELS, LAB_REQUEST_COLORS } from '../constants';
import { viewLab } from '../store/labRequest';
import { PatientNameDisplay } from './PatientNameDisplay';
import { viewPatientEncounter } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';

const StatusLabel = styled.div`
  background: ${p => p.color};
  border-radius: 0.3rem;
  padding: 0.3rem;
`;

const StatusDisplay = React.memo(({ status }) => (
  <StatusLabel color={LAB_REQUEST_COLORS[status] || LAB_REQUEST_COLORS.unknown}>
    {LAB_REQUEST_STATUS_LABELS[status] || 'Unknown'}
  </StatusLabel>
));

const getDisplayName = ({ requestedBy }) => (requestedBy || {}).displayName || 'Unknown';
const getPatientName = ({ encounter }) => <PatientNameDisplay patient={encounter.patient} />;
const getPatientDisplayId = ({ encounter }) => encounter.patient.displayId || 'Unknown';
const getStatus = ({ status }) => <StatusDisplay status={status} />;
const getRequestType = ({ category }) => (category || {}).name || 'Unknown';
const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;

const encounterColumns = [
  { key: 'id', title: 'Request ID' },
  { key: 'labRequestType', title: 'Type', accessor: getRequestType, sortable: false },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'displayName', title: 'Requested by', accessor: getDisplayName, sortable: false },
  { key: 'requestedDate', title: 'Date', accessor: getDate },
];

const globalColumns = [
  { key: 'patient', title: 'Patient', accessor: getPatientName, sortable: false },
  { key: 'patient', title: 'Patient ID', accessor: getPatientDisplayId, sortable: false },
  ...encounterColumns,
];

const DumbLabRequestsTable = React.memo(({ encounterId, onLabSelect }) => {
  const { loadEncounter, encounter } = useEncounter();
  const selectLab = useCallback(async lab => {
    if (!encounter) {
      // no encounter, likely on the labs page
      await loadEncounter(lab.encounterId);
    }
    onLabSelect(lab);
  }, []);

  return (
    <DataFetchingTable
      endpoint={encounterId ? `encounter/${encounterId}/labRequests` : 'labRequest'}
      columns={encounterId ? encounterColumns : globalColumns}
      noDataMessage="No lab requests found"
      onRowClick={selectLab}
    />
  );
});

export const LabRequestsTable = connect(null, dispatch => ({
  onLabSelect: lab => {
    const { encounter, id } = lab;
    if (encounter) dispatch(viewPatientEncounter(encounter.patient.id, encounter.id));

    dispatch(viewLab(id));
  },
}))(DumbLabRequestsTable);
