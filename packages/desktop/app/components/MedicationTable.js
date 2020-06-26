import React from 'react';
import { connect } from 'react-redux';

import { Table, DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { viewVisit } from '../store/visit';

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
    accessor: ({ visits }) => `${visits[0].patient[0].firstName} ${visits[0].patient[0].lastName}`,
    sortable: false,
  },
  ...COLUMNS,
];

export const VisitMedicationTable = React.memo(({ visitId }) => (
  <DataFetchingTable
    columns={COLUMNS} 
    endpoint={`visit/${visitId}/medications`}
  />
));

export const DataFetchingMedicationTable = connect(
  null,
  dispatch => ({ onMedicationSelect: medication => dispatch(viewVisit(medication.visits[0].id)) }),
)(({ onMedicationSelect }) => (
  <DataFetchingTable
    endpoint="medication"
    columns={PATIENT_COLUMNS}
    noDataMessage="No medication requests found"
    onRowClick={onMedicationSelect}
  />
));
