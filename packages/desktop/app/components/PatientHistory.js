import React, { useState } from 'react';
import styled from 'styled-components';
import { Tooltip } from '@material-ui/core';

import { OutlinedButton } from './Button';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MarkPatientForSync } from './MarkPatientForSync';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { LocationGroupCell } from './LocationCell';
import { LimitedLinesCell } from './FormattedTableCell';

const DateWrapper = styled.div`
  min-width: 90px;
`;

const getDate = ({ startDate, endDate }) => (
  <DateWrapper>
    <DateDisplay date={startDate} />
    {' - '}
    {endDate ? <DateDisplay date={endDate} /> : 'Current'}
  </DateWrapper>
);
const getType = ({ encounterType }) => ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label;
const getReasonForEncounter = ({ reasonForEncounter }) => <div>{reasonForEncounter}</div>;
const getFacility = ({ facilityName }) => <div>{facilityName}</div>;

const columns = [
  {
    key: 'startDate',
    title: 'Date',
    accessor: getDate,
    // maxWidth: 150,
    // CellComponent: LimitedLinesCell,
  },
  {
    key: 'encounterType',
    title: 'Type',
    accessor: getType,
    sortable: false,
    // minWidth: 90,
    // maxWidth: 90,
    // CellComponent: LimitedLinesCell,
  },
  {
    key: 'facilityName',
    title: 'Facility',
    accessor: getFacility,
    // maxWidth: 90,
    // CellComponent: LimitedLinesCell,
  },
  {
    key: 'locationGroupName',
    title: 'Area',
    accessor: LocationGroupCell,
    // maxWidth: 100,
    // CellComponent: LimitedLinesCell,
  },
  {
    key: 'reasonForEncounter',
    title: 'Reason for encounter',
    accessor: getReasonForEncounter,
    sortable: false,
    CellComponent: LimitedLinesCell,
    maxWidth: 150,
  },
];

const SyncWarning = styled.p`
  margin: 1rem;
`;

const RefreshButton = styled(OutlinedButton)`
  margin-left: 0.5rem;
`;

export const PatientHistory = ({ patient, onItemClick }) => {
  const [refreshCount, setRefreshCount] = useState(0);

  if (!patient.markedForSync) {
    return <MarkPatientForSync patient={patient} />;
  }
  return (
    <>
      {patient.syncing && (
        <SyncWarning>
          Patient is being synced, so records might not be fully updated.
          <RefreshButton onClick={() => setRefreshCount(refreshCount + 1)}>Refresh</RefreshButton>
        </SyncWarning>
      )}
      <DataFetchingTable
        columns={columns}
        onRowClick={row => onItemClick(row.id)}
        noDataMessage="No historical records for this patient."
        endpoint={`patient/${patient.id}/encounters`}
        initialSort={{ orderBy: 'startDate', order: 'desc' }}
        refreshCount={refreshCount}
      />
    </>
  );
};
