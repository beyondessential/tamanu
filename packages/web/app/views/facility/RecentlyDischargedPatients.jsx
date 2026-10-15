import React from 'react';
import { PATIENT_STATUS_LABELS } from '@tamanu/constants';
import {
  ContentPane,
  DateDisplay,
  PageContainer,
  RecentlyDischargedPatientsSearchBar,
  SearchTableTitle,
  SearchTableWithPermissionCheck,
  TopBar,
  TranslatedEnum,
  TranslatedText,
} from '../../components';
import { PatientSearchKeys, usePatientSearch } from '../../contexts/PatientSearch';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import {
  clinician,
  dateOfBirth,
  department,
  displayId,
  firstName,
  lastName,
  sex,
} from '../patients/columns';

// spec: RDISCH#table
const COLUMNS = [
  {
    ...displayId,
    title: (
      <TranslatedText
        stringId="general.patientId.label"
        fallback="Patient ID"
        data-testid="translatedtext-rdp-col-patient-id"
      />
    ),
    sortable: false,
  },
  firstName,
  lastName,
  dateOfBirth,
  { ...sex, sortable: true },
  {
    key: 'patientStatus',
    title: (
      <TranslatedText
        stringId="encounter.encounterType.label"
        fallback="Encounter type"
        data-testid="translatedtext-rdp-col-encounter-type"
      />
    ),
    accessor: ({ patientStatus }) => (
      <TranslatedEnum
        value={patientStatus}
        enumValues={PATIENT_STATUS_LABELS}
        data-testid="translatedenum-rdp-patient-status"
      />
    ),
  },
  department,
  { ...clinician, sortable: true },
  {
    key: 'dischargeDate',
    title: (
      <TranslatedText
        stringId="discharge.dischargeDate.label"
        fallback="Discharge date"
        data-testid="translatedtext-rdp-col-discharge-date"
      />
    ),
    accessor: ({ dischargeDate }) => (
      <DateDisplay date={dischargeDate} data-testid="datedisplay-rdp-discharge-date" />
    ),
  },
];

const INITIAL_SORT = { orderBy: 'dischargeDate', order: 'desc' };

export const RecentlyDischargedPatients = () => {
  const { searchParameters, setSearchParameters } = usePatientSearch(
    PatientSearchKeys.RecentlyDischargedPatientsView,
  );
  const { navigateToPatient } = usePatientNavigation();

  return (
    <PageContainer data-testid="pagecontainer-rdp">
      <TopBar
        title={
          <TranslatedText
            stringId="patientList.recentlyDischarged.title"
            fallback="Recently discharged patients"
            data-testid="translatedtext-rdp-title"
          />
        }
        data-testid="topbar-rdp"
      />
      <ContentPane data-testid="contentpane-rdp">
        <SearchTableTitle data-testid="searchtabletitle-rdp">
          <TranslatedText
            stringId="patientList.search.title"
            fallback="Patient search"
            data-testid="translatedtext-rdp-search-title"
          />
        </SearchTableTitle>
        <RecentlyDischargedPatientsSearchBar
          onSearch={setSearchParameters}
          searchParameters={searchParameters}
          data-testid="recentlydischargedpatientssearchbar-rdp"
        />
        <SearchTableWithPermissionCheck
          verb="list"
          noun="Patient"
          endpoint="recentlyDischargedPatients"
          columns={COLUMNS}
          initialSort={INITIAL_SORT}
          fetchOptions={{ ...searchParameters }}
          onRowClick={row => navigateToPatient(row.id)}
          rowStyle={({ dateOfDeath }) =>
            // Style rows for deceased patients red, as on the other patient listings
            dateOfDeath ? '& > td:not(:first-child) { color: #ed333a; }' : ''
          }
          noDataMessage={
            <TranslatedText
              stringId="patientList.table.noData"
              fallback="No patients found"
              data-testid="translatedtext-rdp-no-data"
            />
          }
          data-testid="searchtablewithpermissioncheck-rdp"
        />
      </ContentPane>
    </PageContainer>
  );
};
