import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MarkPatientForSync } from './MarkPatientForSync';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { LocationGroupCell } from './LocationCell';
import { LimitedLinesCell } from './FormattedTableCell';
import { TranslatedText } from './Translation/TranslatedText';
import { DeleteEncounterModal } from '../views/patients/components/DeleteEncounterModal';
import { MenuButton } from './MenuButton';
import { useSyncState } from '../contexts/SyncState';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { useAuth } from '../contexts/Auth';

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
    {endDate ? (
      <DateDisplay date={endDate} />
    ) : (
      <TranslatedText stringId="general.date.current" fallback="Current" />
    )}
  </DateWrapper>
);
const getType = ({ encounterType }) => ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label;
const getReasonForEncounter = ({ reasonForEncounter }) => <div>{reasonForEncounter}</div>;
const getFacility = ({ facilityName }) => <FacilityWrapper>{facilityName}</FacilityWrapper>;

const SyncWarning = styled.p`
  margin: 1rem;
`;

const SyncWarningBanner = ({ patient, onRefresh }) => {
  const syncState = useSyncState();
  const isSyncing = syncState.isPatientSyncing(patient.id);
  const [wasSyncing, setWasSyncing] = useState(isSyncing);

  if (isSyncing !== wasSyncing) {
    setWasSyncing(isSyncing);
    // refresh the table on a timeout so we aren't updating two components at once
    setTimeout(onRefresh, 100);
  }

  if (!isSyncing) return null;

  return (
    <SyncWarning>
      <TranslatedText
        stringId="patient.history.syncWarning"
        fallback="Patient is being synced, so records might not be fully updated."
      />
    </SyncWarning>
  );
};

export const PatientHistory = ({ patient, onItemClick }) => {
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const queryClient = useQueryClient();
  const { ability } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEncounterData, setSelectedEncounterData] = useState(null);

  const actions = [
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      action: () => setModalOpen(true),
      permissionCheck: () => {
        return ability?.can('delete', 'Encounter');
      },
    },
  ].filter(({ permissionCheck }) => {
    return permissionCheck ? permissionCheck() : true;
  });

  const columns = [
    {
      key: 'startDate',
      title: <TranslatedText stringId="general.date.label" fallback="Date" />,
      accessor: getDate,
    },
    {
      key: 'encounterType',
      title: <TranslatedText stringId="patientHistory.table.column.encounterType" fallback="Type" />,
      accessor: getType,
      sortable: false,
    },
    {
      key: 'facilityName',
      title: <TranslatedText stringId="general.table.column.facilityName" fallback="Facility" />,
      accessor: getFacility,
      CellComponent: LimitedLinesCell,
    },
    {
      key: 'locationGroupName',
      title: <TranslatedText stringId="general.table.column.area" fallback="Area" />,
      accessor: LocationGroupCell,
      CellComponent: LimitedLinesCell,
    },
    {
      key: 'reasonForEncounter',
      title: (
        <TranslatedText
          stringId="patientHistory.table.column.reasonForEncounter"
          fallback="Reason for encounter"
        />
      ),
      accessor: getReasonForEncounter,
      sortable: false,
      CellComponent: LimitedLinesCell,
    },
  ];

  // Only include actions column when there is at least one action
  if (actions.length > 0) {
    columns.push({
      // key and title are empty strings to display a blank column name
      key: '',
      title: '',
      sortable: false,
      dontCallRowInput: true,
      CellComponent: ({ data }) => (
        <div onMouseEnter={() => setSelectedEncounterData(data)}>
          <MenuButton actions={actions} />
        </div>
      ),
    });
  }

  if (!patient.markedForSync) {
    return <MarkPatientForSync patient={patient} />;
  }
  return (
    <>
      <SyncWarningBanner patient={patient} onRefresh={updateRefreshCount} />
      <DataFetchingTable
        columns={columns}
        onRowClick={row => onItemClick(row.id)}
        noDataMessage={
          <TranslatedText
            stringId="patient.history.table.noDataMessage"
            fallback="No historical records for this patient"
          />
        }
        endpoint={`patient/${patient.id}/encounters`}
        initialSort={{ orderBy: 'startDate', order: 'desc' }}
        refreshCount={refreshCount}
      />

      <DeleteEncounterModal
        open={modalOpen}
        encounterToDelete={selectedEncounterData}
        patient={patient}
        onClose={() => {
          setModalOpen(false);
          queryClient.invalidateQueries(['patientCurrentEncounter', patient.id]);
          updateRefreshCount();
        }}
      />
    </>
  );
};
