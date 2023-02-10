import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { useEncounter } from '../contexts/Encounter';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TriageWaitTimeCell } from './TriageWaitTimeCell';
import { useLocalisation } from '../contexts/Localisation';
import { reloadPatient } from '../store';
import { usePatient } from '../contexts/Patient';

const ADMITTED_PRIORITY_COLOR = '#bdbdbd';

const useColumns = () => {
  const { getLocalisation } = useLocalisation();
  const triageCategories = getLocalisation('triageCategories');

  return [
    {
      key: 'arrivalTime',
      title: 'Wait time',
      // Cell color cannot be set on the component due to the way table cells are configured so the
      // cell color must be calculated and set in the table config separately
      cellColor: ({ score, encounterType }) => {
        switch (encounterType) {
          case 'triage':
            return triageCategories.find(c => c.level === parseInt(score))?.color;
          default:
            return ADMITTED_PRIORITY_COLOR;
        }
      },
      accessor: TriageWaitTimeCell,
      isExportable: false,
    },
    { key: 'chiefComplaint', title: 'Chief complaint' },
    { key: 'displayId' },
    { key: 'patientName', title: 'Patient', accessor: row => `${row.firstName} ${row.lastName}` },
    { key: 'dateOfBirth', accessor: row => <DateDisplay date={row.dateOfBirth} /> },
    {
      key: 'sex',
      accessor: row => <span style={{ textTransform: 'capitalize' }}>{row.sex || ''}</span>,
    },
    { key: 'locationGroupName', title: 'Area' },
    { key: 'locationName', title: 'Location' },
  ];
};

export const TriageTable = React.memo(() => {
  const { loadEncounter } = useEncounter();
  const { loadPatient } = usePatient();
  const { category } = useParams();
  const columns = useColumns();

  const viewEncounter = async triage => {
    await loadPatient(triage.patientId);
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
