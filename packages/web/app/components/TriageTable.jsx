import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { useEncounter } from '../contexts/Encounter';
import { useAuth } from '../contexts/Auth';
import { DateDisplay } from './DateDisplay';
import { LocationCell, LocationGroupCell } from './LocationCell';
import { TriageWaitTimeCell } from './TriageWaitTimeCell';
import { reloadPatient } from '../store';
import { TranslatedReferenceData, TranslatedSex, TranslatedText } from './Translation';
import { DataFetchingTableWithPermissionCheck } from './Table/DataFetchingTable';
import { useSettings } from '../contexts/Settings';

const ADMITTED_PRIORITY_COLOR = '#bdbdbd';

const useColumns = () => {
  const { getSetting } = useSettings();
  const triageCategories = getSetting('triageCategories');

  return [
    {
      key: 'arrivalTime',
      title: (
        <TranslatedText
          stringId="patientList.triage.table.column.waitTime"
          fallback="Wait time"
          data-test-id='translatedtext-yzkk' />
      ),
      // Cell color cannot be set on the component due to the way table cells are configured so the
      // cell color must be calculated and set in the table config separately
      cellColor: ({ score, encounterType }) => {
        switch (encounterType) {
          case 'triage':
            return triageCategories.find(c => c.level === parseInt(score))?.color;
          default:
            return ADMITTED_PRIORITY_COLOR;
        }
      },
      accessor: TriageWaitTimeCell,
      isExportable: false,
    },
    {
      key: 'chiefComplaint',
      title: (
        <TranslatedText
          stringId="patientList.triage.table.column.chiefComplaint"
          fallback="Chief complaint"
          data-test-id='translatedtext-816p' />
      ),
      accessor: row => (
        <TranslatedReferenceData
          value={row.chiefComplaintId}
          fallback={row.chiefComplaint}
          category="triageReason"
          data-test-id='translatedreferencedata-5oio' />
      ),
    },
    {
      key: 'displayId',
      title: (
        <TranslatedText
          stringId="general.localisedField.displayId.label.short"
          fallback="NHN"
          data-test-id='translatedtext-yir0' />
      ),
    },
    {
      key: 'patientName',
      title: <TranslatedText
        stringId="general.patient.label"
        fallback="Patient"
        data-test-id='translatedtext-gsb7' />,
      accessor: row => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'dateOfBirth',
      title: (
        <TranslatedText
          stringId="general.localisedField.dateOfBirth.label.short"
          fallback="DOB"
          data-test-id='translatedtext-6ryf' />
      ),
      accessor: row => <DateDisplay date={row.dateOfBirth} data-test-id='datedisplay-t29y' />,
    },
    {
      key: 'sex',
      title: <TranslatedText
        stringId="general.localisedField.sex.label"
        fallback="Sex"
        data-test-id='translatedtext-i2ge' />,
      accessor: row => <TranslatedSex sex={row.sex} />,
    },
    {
      key: 'locationGroupName',
      title: <TranslatedText
        stringId="general.table.column.area"
        fallback="Area"
        data-test-id='translatedtext-2a0l' />,
      accessor: LocationGroupCell,
    },
    {
      key: 'locationName',
      title: <TranslatedText
        stringId="general.location.label"
        fallback="Location"
        data-test-id='translatedtext-o7qm' />,
      accessor: LocationCell,
    },
  ];
};

export const TriageTable = React.memo(() => {
  const { facilityId } = useAuth();
  const { loadEncounter } = useEncounter();
  const { category } = useParams();
  const dispatch = useDispatch();
  const columns = useColumns();

  const viewEncounter = async triage => {
    await dispatch(reloadPatient(triage.patientId));
    await loadEncounter(triage.encounterId);
    dispatch(push(`/patients/${category}/${triage.patientId}/encounter/${triage.encounterId}`));
  };

  return (
    <DataFetchingTableWithPermissionCheck
      verb="list"
      noun="Triage"
      endpoint="triage"
      fetchOptions={{ facilityId }}
      columns={columns}
      noDataMessage={
        <TranslatedText
          stringId="patientList.table.noData"
          fallback="No patients found"
          data-test-id='translatedtext-z1e1' />
      }
      onRowClick={viewEncounter}
    />
  );
});
