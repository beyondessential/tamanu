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
    data-testid='translatedreferencedata-4br7' />
);

const MEDICATION_COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-testid='translatedtext-1wxs' />,
    accessor: ({ date }) => <DateDisplay date={date} data-testid='datedisplay-yrfq' />,
  },
  {
    key: 'medication.name',
    title: <TranslatedText
      stringId="medication.table.column.name"
      fallback="Drug"
      data-testid='translatedtext-9spx' />,
    accessor: getMedicationName,
    sortable: false,
  },
  {
    key: 'prescription',
    title: <TranslatedText
      stringId="medication.instructions.label"
      fallback="Instructions"
      data-testid='translatedtext-k9wv' />,
  },
  {
    key: 'route',
    title: <TranslatedText
      stringId="medication.route.label"
      fallback="Route"
      data-testid='translatedtext-t842' />,
  },
  {
    key: 'endDate',
    title: <TranslatedText
      stringId="medication.endDate.label"
      fallback="End date"
      data-testid='translatedtext-gkze' />,
    accessor: data => (data?.endDate ? <DateDisplay date={data?.endDate} data-testid='datedisplay-e5p0' /> : ''),
  },
  {
    key: 'prescriber',
    title: <TranslatedText
      stringId="medication.prescriber.label"
      fallback="Prescriber"
      data-testid='translatedtext-v7cy' />,
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
      data-testid='translatedtext-aiwb' />,
    accessor: ({ encounter }) => `${encounter.patient.firstName} ${encounter.patient.lastName}`,
    sortable: false,
  },
  {
    key: 'department',
    title: <TranslatedText
      stringId="general.department.label"
      fallback="Department"
      data-testid='translatedtext-v63j' />,
    accessor: ({ encounter }) => (
      <TranslatedReferenceData
        fallback={encounter.department.name}
        value={encounter.department.id}
        category="department"
        data-testid='translatedreferencedata-xtv4' />
    ),
    sortable: false,
  },
  {
    key: 'location',
    title: <TranslatedText
      stringId="general.location.label"
      fallback="Location"
      data-testid='translatedtext-r5te' />,
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
        data-testid='medicationmodal-rem9' />
      <DataFetchingTable
        columns={MEDICATION_COLUMNS}
        endpoint={`encounter/${encounterId}/medications`}
        onRowClick={onMedicationSelect}
        rowStyle={rowStyle}
        elevated={false}
        data-testid='datafetchingtable-mxde' />
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
          data-testid='translatedtext-2uuq' />
      }
      initialSort={{ order: 'desc', orderBy: 'date' }}
      onRowClick={onMedicationSelect}
      data-testid='datafetchingtablewithpermissioncheck-5ngb' />
  );
};
