import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { useEncounter } from '../contexts/Encounter';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { LocationCell, LocationGroupCell } from './LocationCell';
import { TriageWaitTimeCell } from './TriageWaitTimeCell';
import { useLocalisation } from '../contexts/Localisation';
import { reloadPatient } from '../store';
import { TranslatedText } from './Translation/TranslatedText';

const ADMITTED_PRIORITY_COLOR = '#bdbdbd';

const useColumns = () => {
  const { getLocalisation } = useLocalisation();
  const triageCategories = getLocalisation('triageCategories');

  return [
    {
      key: 'arrivalTime',
      title: (
        <TranslatedText
          stringId="patientList.emergency.table.column.waitTime"
          fallback="Wait time"
        />
      ),
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
    {
      key: 'chiefComplaint',
      title: (
        <TranslatedText
          stringId="patientList.emergency.table.column.chiefComplaint"
          fallback="Chief complaint"
        />
      ),
    },
    {
      key: 'displayId',
    },
    {
      key: 'patientName',
      title: (
        <TranslatedText stringId="patientList.emergency.table.column.patient" fallback="Patient" />
      ),
      accessor: row => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'dateOfBirth',
      accessor: row => <DateDisplay date={row.dateOfBirth} />,
    },
    {
      key: 'sex',
      accessor: row => <span style={{ textTransform: 'capitalize' }}>{row.sex || ''}</span>,
    },
    {
      key: 'locationGroupName',
      title: <TranslatedText stringId="general.table.column.area" fallback="Area" />,
      accessor: LocationGroupCell,
    },
    {
      key: 'locationName',
      title: <TranslatedText stringId="general.table.column.location" fallback="Location" />,
      accessor: LocationCell,
    },
  ];
};

export const TriageTable = React.memo(() => {
  const { loadEncounter } = useEncounter();
  const { category } = useParams();
  const dispatch = useDispatch();
  const columns = useColumns();

  const viewEncounter = async triage => {
    await dispatch(reloadPatient(triage.patientId));
    await loadEncounter(triage.encounterId);
    dispatch(push(`/patients/${category}/${triage.patientId}/encounter/${triage.encounterId}`));
  };

  return (
    <DataFetchingTable
      endpoint="triage"
      columns={columns}
      noDataMessage={
        <TranslatedText stringId="patientListing.table.noData" fallback="No patients found" />
      }
      onRowClick={viewEncounter}
    />
  );
});
