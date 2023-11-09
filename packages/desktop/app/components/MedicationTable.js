import React, { useCallback, useState } from 'react';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { useEncounter } from '../contexts/Encounter';
import { MedicationModal } from './MedicationModal';
import { reloadPatient } from '../store';
import { ENCOUNTER_TAB_NAMES } from '../constants/encounterTabNames';
import { Colors } from '../constants';
import { getFullLocationName } from '../utils/location';

const getMedicationName = ({ medication }) => medication.name;

const MEDICATION_COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'medication.name', title: 'Drug', accessor: getMedicationName, sortable: false },
  { key: 'prescription', title: 'Prescription' },
  { key: 'route', title: 'Route' },
  {
    key: 'endDate',
    title: 'End Date',
    accessor: data => (data?.endDate ? <DateDisplay date={data?.endDate} /> : ''),
  },
  {
    key: 'prescriber',
    title: 'Prescriber',
    accessor: data => data?.prescriber?.displayName ?? '',
    sortable: false,
  },
];

const FULL_LISTING_COLUMNS = [
  {
    key: 'name',
    title: 'Patient',
    accessor: ({ encounter }) => `${encounter.patient.firstName} ${encounter.patient.lastName}`,
    sortable: false,
  },
  {
    key: 'department',
    title: 'Department',
    accessor: ({ encounter }) => encounter.department.name,
    sortable: false,
  },
  {
    key: 'location',
    title: 'Location',
    accessor: ({ encounter }) => getFullLocationName(encounter.location),
    sortable: false,
  },
  ...MEDICATION_COLUMNS,
];

export const EncounterMedicationTable = React.memo(({ encounterId }) => {
  const [isOpen, setModalOpen] = useState(false);
  const [encounterMedication, setEncounterMedication] = useState(null);
  const { loadEncounter } = useEncounter();

  const onClose = useCallback(() => setModalOpen(false), [setModalOpen]);
  const onSaved = useCallback(async () => {
    await loadEncounter(encounterId);
  }, [loadEncounter, encounterId]);

  const onMedicationSelect = useCallback(async medication => {
    setModalOpen(true);
    setEncounterMedication(medication);
  }, []);

  const rowStyle = ({ discontinued }) =>
    discontinued
      ? `
        color: ${Colors.alert};
        text-decoration: line-through;`
      : '';

  return (
    <div>
      <MedicationModal
        open={isOpen}
        encounterId={encounterId}
        onClose={onClose}
        onSaved={onSaved}
        medication={encounterMedication}
        readOnly
      />
      <DataFetchingTable
        columns={MEDICATION_COLUMNS}
        endpoint={`encounter/${encounterId}/medications`}
        onRowClick={onMedicationSelect}
        rowStyle={rowStyle}
        elevated={false}
      />
    </div>
  );
});

export const DataFetchingMedicationTable = () => {
  const { loadEncounter } = useEncounter();
  const dispatch = useDispatch();
  const onMedicationSelect = useCallback(
    async medication => {
      await loadEncounter(medication.encounter.id);
      await dispatch(reloadPatient(medication.encounter.patientId));
      dispatch(
        push(
          `/patients/all/${medication.encounter.patientId}/encounter/${medication.encounter.id}?tab=${ENCOUNTER_TAB_NAMES.MEDICATION}`,
        ),
      );
    },
    [loadEncounter, dispatch],
  );

  return (
    <DataFetchingTable
      endpoint="medication"
      columns={FULL_LISTING_COLUMNS}
      noDataMessage="No medication requests found"
      initialSort={{ order: 'desc', orderBy: 'date' }}
      onRowClick={onMedicationSelect}
    />
  );
};
