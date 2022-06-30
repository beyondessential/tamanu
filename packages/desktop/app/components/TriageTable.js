import React from 'react';
import { useDispatch } from 'react-redux';
import { viewPatientEncounter } from '../store';
import { useEncounter } from '../contexts/Encounter';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TriageWaitTimeCell, getTriageCellColor } from './TriageWaitTimeCell';

const COLUMNS = [
  {
    key: 'score',
    title: 'Wait time',
    cellColor: getTriageCellColor,
    accessor: TriageWaitTimeCell,
  },
  { key: 'chiefComplaint', title: 'Chief complaint' },
  { key: 'displayId' },
  { key: 'patientName', title: 'Patient', accessor: row => `${row.firstName} ${row.lastName}` },
  { key: 'dateOfBirth', accessor: row => <DateDisplay date={row.dateOfBirth} /> },
  {
    key: 'sex',
    accessor: row => <span style={{ textTransform: 'capitalize' }}>{row.sex || ''}</span>,
  },
  { key: 'locationName', title: 'Location' },
];

export const TriageTable = React.memo(() => {
  const { loadEncounter } = useEncounter();
  const dispatch = useDispatch();

  const viewEncounter = async triage => {
    await loadEncounter(triage.encounterId);
    dispatch(viewPatientEncounter(triage.patientId, triage.encounterId));
  };

  return (
    <DataFetchingTable
      endpoint="triage"
      columns={COLUMNS}
      noDataMessage="No patients found"
      onRowClick={viewEncounter}
    />
  );
});
