import React, { useCallback } from 'react';
import { push } from 'connected-react-router';
import { connect } from 'react-redux';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { useEncounter } from '../contexts/Encounter';

const getMedicationName = ({ medication }) => medication.name;

const MEDICATION_COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'medication.name', title: 'Drug', accessor: getMedicationName },
  { key: 'prescription', title: 'Prescription' },
];

const FULL_LISTING_COLUMNS = [
  {
    key: 'name',
    title: 'Patient',
    accessor: ({ encounter }) => `${encounter.patient.firstName} ${encounter.patient.lastName}`,
    sortable: false,
  },
  {
    key: 'department',
    title: 'Department',
    accessor: ({ encounter }) => encounter.department.name,
    sortable: false,
  },
  {
    key: 'location',
    title: 'Location',
    accessor: ({ encounter }) => encounter.location.name,
    sortable: false,
  },
  ...MEDICATION_COLUMNS,
];

export const EncounterMedicationTable = React.memo(({ encounterId }) => (
  <DataFetchingTable
    columns={MEDICATION_COLUMNS}
    endpoint={`encounter/${encounterId}/medications`}
  />
));

export const DataFetchingMedicationTable = () => {
  const { setEncounterId } = useEncounter();
  const onMedicationSelect = useCallback(medication => {
    setEncounterId(medication.encounter.id);
  }, []);

  return (
    <DataFetchingTable
      endpoint="medication"
      columns={FULL_LISTING_COLUMNS}
      noDataMessage="No medication requests found"
      onRowClick={onMedicationSelect}
    />
  );
};
