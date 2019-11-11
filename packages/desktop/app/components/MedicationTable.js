import React from 'react';
import { connect } from 'react-redux';

import { Table, DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { viewVisit } from '../store/visit';

const getDrugName = ({ drug }) => drug.name;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'drug.name', title: 'Drug', accessor: getDrugName },
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

export const VisitMedicationTable = React.memo(({ medications }) => (
  <Table columns={COLUMNS} data={medications} />
));

export const DataFetchingMedicationTable = connect(
  null,
  dispatch => ({ onMedicationSelect: medication => dispatch(viewVisit(medication.visits[0]._id)) }),
)(({ onMedicationSelect }) => (
  <DataFetchingTable
    endpoint="medication"
    columns={PATIENT_COLUMNS}
    noDataMessage="No medication requests found"
    onRowClick={onMedicationSelect}
  />
));
