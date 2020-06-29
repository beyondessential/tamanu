import React from 'react';
import { connect } from 'react-redux';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { viewEncounter } from '../store/encounter';

const getMedicationName = ({ medication }) => medication.name;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'medication.name', title: 'Drug', accessor: getMedicationName },
  { key: 'prescription', title: 'Prescription' },
];

const PATIENT_COLUMNS = [
  {
    key: 'name',
    title: 'Patient',
    accessor: ({ encounters }) => `${encounters[0].patient[0].firstName} ${encounters[0].patient[0].lastName}`,
    sortable: false,
  },
  ...COLUMNS,
];

export const EncounterMedicationTable = React.memo(({ encounterId }) => (
  <DataFetchingTable columns={COLUMNS} endpoint={`encounter/${encounterId}/medications`} />
));

export const DataFetchingMedicationTable = connect(null, dispatch => ({
  onMedicationSelect: medication => dispatch(viewEncounter(medication.encounters[0].id)),
}))(({ onMedicationSelect }) => (
  <DataFetchingTable
    endpoint="medication"
    columns={PATIENT_COLUMNS}
    noDataMessage="No medication requests found"
    onRowClick={onMedicationSelect}
  />
));
