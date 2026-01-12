import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router';
import { useEncounter } from '../contexts/Encounter';
import { useAuth } from '../contexts/Auth';
import { DateOnlyDisplay } from './DateDisplay';
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
          data-testid="translatedtext-xy39"
        />
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
          data-testid="translatedtext-ziou"
        />
      ),
      accessor: row => (
        <TranslatedReferenceData
          value={row.chiefComplaintId}
          fallback={row.chiefComplaint}
          category="triageReason"
          data-testid="translatedreferencedata-4x0j"
        />
      ),
    },
    {
      key: 'displayId',
      title: (
        <TranslatedText
          stringId="general.localisedField.displayId.label.short"
          fallback="NHN"
          data-testid="translatedtext-1wg9"
        />
      ),
    },
    {
      key: 'patientName',
      title: (
        <TranslatedText
          stringId="general.patient.label"
          fallback="Patient"
          data-testid="translatedtext-h868"
        />
      ),
      accessor: row => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'dateOfBirth',
      title: (
        <TranslatedText
          stringId="general.localisedField.dateOfBirth.label.short"
          fallback="DOB"
          data-testid="translatedtext-daoi"
        />
      ),
      accessor: row => <DateOnlyDisplay date={row.dateOfBirth} data-testid="datedisplay-gy0v" />,
    },
    {
      key: 'sex',
      title: (
        <TranslatedText
          stringId="general.localisedField.sex.label"
          fallback="Sex"
          data-testid="translatedtext-qa0c"
        />
      ),
      accessor: row => <TranslatedSex sex={row.sex} data-testid="translatedsex-wqbc" />,
    },
    {
      key: 'locationGroupName',
      title: (
        <TranslatedText
          stringId="general.table.column.area"
          fallback="Area"
          data-testid="translatedtext-u3wm"
        />
      ),
      accessor: LocationGroupCell,
    },
    {
      key: 'locationName',
      title: (
        <TranslatedText
          stringId="general.location.label"
          fallback="Location"
          data-testid="translatedtext-2uc7"
        />
      ),
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
  const navigate = useNavigate();

  const viewEncounter = async triage => {
    await dispatch(reloadPatient(triage.patientId));
    await loadEncounter(triage.encounterId);
    navigate(`/patients/${category}/${triage.patientId}/encounter/${triage.encounterId}`);
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
          data-testid="translatedtext-vbj4"
        />
      }
      onRowClick={viewEncounter}
      data-testid="datafetchingtablewithpermissioncheck-7800"
    />
  );
});
