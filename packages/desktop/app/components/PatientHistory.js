import React from 'react';

import CircularProgress from '@material-ui/core/CircularProgress';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MarkPatientForSync } from './MarkPatientForSync';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';

const getDate = ({ startDate }) => <DateDisplay date={startDate} />;
const getType = ({ encounterType }) => ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label;
const getDescription = ({ reasonForEncounter }) => <div>{reasonForEncounter}</div>;
const getEndDate = ({ endDate }) => (endDate ? <DateDisplay date={endDate} /> : 'Current');

const columns = [
  { key: 'startDate', title: 'Start date', accessor: getDate },
  { key: 'endDate', title: 'End date', accessor: getEndDate },
  { key: 'type', title: 'Type', accessor: getType },
  { key: 'description', title: 'Description', accessor: getDescription },
];

export const PatientHistory = ({ patient, onItemClick }) => {
  if (patient.syncing) {
    return (
      <div style={{ margin: '1rem' }}>
        <CircularProgress />
      </div>
    );
  }
  if (!patient.markedForSync) {
    return <MarkPatientForSync patient={patient} />;
  }
  return (
    <DataFetchingTable
      columns={columns}
      onRowClick={row => onItemClick(row.id)}
      noDataMessage="No historical records for this patient."
      endpoint={`patient/${patient.id}/encounters`}
      initialSort={{ orderBy: 'startDate', order: 'desc' }}
    />
  );
};
