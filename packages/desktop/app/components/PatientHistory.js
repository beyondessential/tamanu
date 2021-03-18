import React from 'react';
import { connectApi } from '../api';
import { DataFetchingTable } from './Table';
import { RefreshIconButton } from '../components/Button';

import { DateDisplay } from './DateDisplay';
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

export const PatientHistory = ({ patient, markedForSync, pulledAt, onItemClick, onMarkForSync, onReload }) => {
  if (!patient) {
    return null;
  }
  if (!patient.markedForSync) {
    return (
      <div>
        Not yet marked for sync
        <RefreshIconButton onClick={onMarkForSync} />
      </div>
    );
  }
  return (
    <DataFetchingTable
      columns={columns}
      onRowClick={row => onItemClick(row.id)}
      noDataMessage="No historical records for this patient."
      endpoint={`patient/${patient.id}/encounters`}
    />
  );
};
