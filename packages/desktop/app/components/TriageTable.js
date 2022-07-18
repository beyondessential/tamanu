import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { useEncounter } from '../contexts/Encounter';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TriageWaitTimeCell } from './TriageWaitTimeCell';
import { useLocalisation } from '../contexts/Localisation';

const useColumns = () => {
  const { getLocalisation } = useLocalisation();
  const triageCategories = getLocalisation('triageCategories');

  return [
    {
      key: 'score',
      title: 'Wait time',
      // Cell color cannot be set on the component due to the way table cells are configured so the
      // cell color must be calculated and set in the table config separately
      cellColor: ({ score }) => triageCategories.find(c => c.level === parseInt(score))?.color,
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
};

export const TriageTable = React.memo(() => {
  const { loadEncounter } = useEncounter();
  const { category } = useParams();
  const dispatch = useDispatch();
  const columns = useColumns();

  const viewEncounter = async triage => {
    await loadEncounter(triage.encounterId);
    dispatch(push(`/patients/${category}/${triage.patientId}/encounter/${triage.encounterId}`));
  };

  return (
    <DataFetchingTable
      endpoint="triage"
      columns={columns}
      noDataMessage="No patients found"
      onRowClick={viewEncounter}
    />
  );
});
