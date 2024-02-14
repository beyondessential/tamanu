import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';

import { OutlinedButton } from './Button';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MarkPatientForSync } from './MarkPatientForSync';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { LocationGroupCell } from './LocationCell';
import { LimitedLinesCell } from './FormattedTableCell';
import { MenuButton } from './MenuButton';
import { DeleteEncounterModal } from '../views/patients/components/DeleteEncounterModal';
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
    {endDate ? <DateDisplay date={endDate} /> : 'Current'}
  </DateWrapper>
);
const getType = ({ encounterType }) => ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label;
const getReasonForEncounter = ({ reasonForEncounter }) => <div>{reasonForEncounter}</div>;
const getFacility = ({ facilityName }) => <FacilityWrapper>{facilityName}</FacilityWrapper>;

const SyncWarning = styled.p`
  margin: 1rem;
`;

const RefreshButton = styled(OutlinedButton)`
  margin-left: 0.5rem;
`;

export const PatientHistory = ({ patient, onItemClick }) => {
  const queryClient = useQueryClient();
  const { ability } = useAuth();
  const [refreshCount, setRefreshCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEncounterData, setSelectedEncounterData] = useState(null);

  const allMenuActions = [
    {
      label: 'Delete',
      action: () => setModalOpen(true),
      permissionCheck: () => {
        return ability?.can('delete', 'Encounter');
      },
    },
  ];

  const actions = allMenuActions
    .filter(({ permissionCheck }) => {
      return permissionCheck ? permissionCheck() : true;
    })
    .reduce((acc, { label, action }) => {
      acc[label] = action;
      return acc;
    }, {});

  const isAllActionsDeniedDueToPerm = Object.keys(actions).length === 0;

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
    {
      key: '',
      title: '',
      sortable: false,
      dontCallRowInput: true,
      CellComponent: ({ data }) => {
        if (!isAllActionsDeniedDueToPerm) {
          return (
            <div onMouseEnter={() => setSelectedEncounterData(data)}>
              <MenuButton actions={actions} />
            </div>
          );
        }
        return <></>;
      },
    },
  ];

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
      <DeleteEncounterModal
        open={modalOpen}
        encounterToDelete={selectedEncounterData}
        patient={patient}
        onClose={() => {
          setModalOpen(false);
          queryClient.invalidateQueries(['patientCurrentEncounter', patient.id]);
          setRefreshCount(refreshCount + 1);
        }}
      />
    </>
  );
};
