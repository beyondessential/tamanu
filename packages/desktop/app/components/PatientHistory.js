import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { OutlinedButton } from './Button';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MarkPatientForSync } from './MarkPatientForSync';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { LocationGroupCell } from './LocationCell';
import { LimitedLinesCell } from './FormattedTableCell';
import { useSyncState } from '../contexts/SyncState';

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

const SyncWarningBanner = ({ patient, onRefresh }) => {
  const syncState = useSyncState();
  const isSyncing = syncState.isPatientSyncing(patient.id);
  const [wasSyncing, setWasSyncing] = useState(isSyncing);

  if (isSyncing != wasSyncing) {
    setWasSyncing(isSyncing);
    // refresh the table on a timeout so we aren't updating two components at once
    setTimeout(onRefresh, 100);
  }

  if (!isSyncing) return null;

  return (
    <SyncWarning>
      Patient is being synced, so records might not be fully updated.
    </SyncWarning>
  );
};

export const PatientHistory = ({ patient, onItemClick }) => {
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshTable = useCallback(
    () => setRefreshCount(refreshCount + 1),
    [refreshCount]
  );

  if (!patient.markedForSync) {
    return <MarkPatientForSync patient={patient} />;
  }
  return (
    <>
      <SyncWarningBanner patient={patient} onRefresh={refreshTable} />
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
