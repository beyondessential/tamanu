import React, { useState } from 'react';
import styled from 'styled-components';

import { ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { OutlinedButton } from './Button';
import { DateDisplay } from './DateDisplay';
import { LimitedLinesCell } from './FormattedTableCell';
import { LocationGroupCell } from './LocationCell';
import { MarkPatientForSync } from './MarkPatientForSync';
import { DataFetchingTable } from './Table';

const DateWrapper = styled.div`
  min-width: 90px;
`;

const FacilityWrapper = styled.div`
  min-width: 200px;
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
const getFacility = ({ facilityName }) => <FacilityWrapper>{facilityName}</FacilityWrapper>;

const columns = [
  { key: 'startDate', title: 'Date', accessor: getDate },
  { key: 'encounterType', title: 'Type', accessor: getType, sortable: false },
  {
    key: 'facilityName',
    title: 'Facility',
    accessor: getFacility,
    CellComponent: LimitedLinesCell,
  },
  {
    key: 'locationGroupName',
    title: 'Area',
    accessor: LocationGroupCell,
    CellComponent: LimitedLinesCell,
  },
  {
    key: 'reasonForEncounter',
    title: 'Reason for encounter',
    accessor: getReasonForEncounter,
    sortable: false,
    CellComponent: LimitedLinesCell,
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
