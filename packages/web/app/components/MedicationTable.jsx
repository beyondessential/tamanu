import React, { useCallback, useState } from 'react';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { useEncounter } from '../contexts/Encounter';
import { useAuth } from '../contexts/Auth';
import { MedicationModal } from './MedicationModal';
import { reloadPatient } from '../store';
import { ENCOUNTER_TAB_NAMES } from '../constants/encounterTabNames';
import { Colors } from '../constants';
import { getFullLocationName } from '../utils/location';
import { TranslatedText, TranslatedReferenceData } from './Translation';
import { DataFetchingTableWithPermissionCheck } from './Table/DataFetchingTable';

const getMedicationName = ({ medication }) => (
  <TranslatedReferenceData
    fallback={medication.name}
    value={medication.id}
    category={medication.type}
    data-testid='translatedreferencedata-wmbk' />
);

const MEDICATION_COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-testid='translatedtext-0snb' />,
    accessor: ({ date }) => <DateDisplay date={date} data-testid='datedisplay-28z2' />,
  },
  {
    key: 'medication.name',
    title: <TranslatedText
      stringId="medication.table.column.name"
      fallback="Drug"
      data-testid='translatedtext-vwr8' />,
    accessor: getMedicationName,
    sortable: false,
  },
  {
    key: 'prescription',
    title: <TranslatedText
      stringId="medication.instructions.label"
      fallback="Instructions"
      data-testid='translatedtext-5r71' />,
  },
  {
    key: 'route',
    title: <TranslatedText
      stringId="medication.route.label"
      fallback="Route"
      data-testid='translatedtext-edom' />,
  },
  {
    key: 'endDate',
    title: <TranslatedText
      stringId="medication.endDate.label"
      fallback="End date"
      data-testid='translatedtext-igx8' />,
    accessor: data => (data?.endDate ? <DateDisplay date={data?.endDate} data-testid='datedisplay-e15q' /> : ''),
  },
  {
    key: 'prescriber',
    title: <TranslatedText
      stringId="medication.prescriber.label"
      fallback="Prescriber"
      data-testid='translatedtext-906c' />,
    accessor: data => data?.prescriber?.displayName ?? '',
    sortable: false,
  },
];

const FULL_LISTING_COLUMNS = [
  {
    key: 'name',
    title: <TranslatedText
      stringId="general.patient.label"
      fallback="Patient"
      data-testid='translatedtext-jnht' />,
    accessor: ({ encounter }) => `${encounter.patient.firstName} ${encounter.patient.lastName}`,
    sortable: false,
  },
  {
    key: 'department',
    title: <TranslatedText
      stringId="general.department.label"
      fallback="Department"
      data-testid='translatedtext-3dmz' />,
    accessor: ({ encounter }) => (
      <TranslatedReferenceData
        fallback={encounter.department.name}
        value={encounter.department.id}
        category="department"
        data-testid='translatedreferencedata-08vu' />
    ),
    sortable: false,
  },
  {
    key: 'location',
    title: <TranslatedText
      stringId="general.location.label"
      fallback="Location"
      data-testid='translatedtext-mms3' />,
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
        data-testid='datafetchingtable-35xe' />
    </div>
  );
});

export const DataFetchingMedicationTable = () => {
  const { loadEncounter } = useEncounter();
  const { facilityId } = useAuth();
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
    <DataFetchingTableWithPermissionCheck
      verb="list"
      noun="EncounterMedication"
      endpoint="medication"
      fetchOptions={{ facilityId }}
      columns={FULL_LISTING_COLUMNS}
      noDataMessage={
        <TranslatedText
          stringId="medication.table.noData"
          fallback="No medication requests found"
          data-testid='translatedtext-13bi' />
      }
      initialSort={{ order: 'desc', orderBy: 'date' }}
      onRowClick={onMedicationSelect}
    />
  );
};
