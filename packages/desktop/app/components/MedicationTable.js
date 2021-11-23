import React, { useCallback, useState } from 'react';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { useEncounter } from '../contexts/Encounter';
import { MedicationModal } from './MedicationModal';

const getMedicationName = ({ medication }) => medication.name;

const MEDICATION_COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'medication.name', title: 'Drug', accessor: getMedicationName },
  { key: 'prescription', title: 'Prescription' },
  { key: 'route', title: 'Route' },
  {
    key: 'endDate', title: 'End Date', accessor: data => <DateDisplay date={data?.endDate ?? ''} />,
  },
  { key: 'prescriber', title: 'Prescriber', accessor: data => data?.prescriber?.displayName ?? '' }
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
    accessor: ({ encounter }) => encounter.location.name,
    sortable: false,
  },
  ...MEDICATION_COLUMNS,
];

export const EncounterMedicationTable = React.memo(({ encounterId }) => {
  const [isOpen, setModalOpen] = useState(false);
  const [encounterMedication, setEncounterMedication] = useState(null);
  const onMedicationSelect = useCallback(
    async medication => {
      setModalOpen(true);
      setEncounterMedication(medication);
      console.log(medication);
    },
    [],
  );

  return (
    <div>
      <MedicationModal
        open={isOpen}
        encounterId={encounterId}
        onClose={() => setModalOpen(false)}
        medication={encounterMedication}
        readOnly
      />
      <DataFetchingTable
        columns={MEDICATION_COLUMNS}
        endpoint={`encounter/${encounterId}/medications`}
        onRowClick={onMedicationSelect}
      />
    </div>
  );
});

export const DataFetchingMedicationTable = () => {
  const { loadEncounter } = useEncounter();
  const onMedicationSelect = useCallback(async medication => {
    await loadEncounter(medication.encounter.id);
  }, []);

  return (
    <DataFetchingTable
      endpoint="medication"
      columns={FULL_LISTING_COLUMNS}
      noDataMessage="No medication requests found"
      onRowClick={onMedicationSelect}
    />
  );
};
