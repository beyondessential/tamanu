import React, { useState } from 'react';
import {
  ContentPane,
  ImmunisationSearchBar,
  PageContainer,
  SearchTable,
  SearchTableTitle,
  TopBar,
  TranslatedText,
} from '../../components';
import { dateOfBirth, displayId, sex, village } from './columns';
import {
  getDueDate,
  getStatusTag,
  getVaccineName,
} from '../../features/ImmunisationsTable/accessors';
import { usePatientNavigation } from '../../utils/usePatientNavigation.js';
import { PATIENT_TABS } from '../../constants/patientPaths.js';
import { reloadPatient } from '../../store/index.js';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../api/useApi.js';

const useUpcomingVaccinationsRefreshStats = () => {
  const api = useApi();
  return useQuery(['upcomingVaccinationsRefreshStats'], async () =>
    api.get('upcomingVaccinations/refreshStats'),
  );
};

const getSchedule = record =>
  record?.scheduleName || (
    <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" />
  );

const COLUMNS = [
  displayId,
  {
    key: 'fullName',
    title: <TranslatedText stringId="vaccine.table.column.patientName" fallback="Patient name" />,
    accessor: row => `${row.firstName} ${row.lastName}`,
  },
  dateOfBirth,
  sex,
  village,
  {
    key: 'vaccineDisplayName',
    title: <TranslatedText stringId="vaccine.table.column.vaccine" fallback="Vaccine" />,
    accessor: getVaccineName,
  },
  {
    key: 'schedule',
    title: <TranslatedText stringId="vaccine.table.column.schedule" fallback="Schedule" />,
    accessor: getSchedule,
  },
  {
    key: 'dueDate',
    title: <TranslatedText stringId="vaccine.table.column.dueDate" fallback="Due date" />,
    accessor: getDueDate,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="vaccine.table.column.status" fallback="Status" />,
    accessor: getStatusTag,
    sortable: false,
  },
];

export const ImmunisationsView = () => {
  const { data: refreshStats, error } = useUpcomingVaccinationsRefreshStats();
  const dispatch = useDispatch();
  const [searchParameters, setSearchParameters] = useState({});
  const { navigateToPatient } = usePatientNavigation();
  const onRowClick = async patient => {
    await dispatch(reloadPatient(patient.id));
    navigateToPatient(patient.id, { tab: PATIENT_TABS.VACCINES });
  };

  console.log(refreshStats, error);

  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText stringId="immunisation.register.title" fallback="Immunisation register" />
        }
      />
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText
            stringId="immunisation.register.search.title"
            fallback="Patient immunisation search"
          />
        </SearchTableTitle>
        <ImmunisationSearchBar onSearch={setSearchParameters} />
        <SearchTable
          endpoint="upcomingVaccinations"
          columns={COLUMNS}
          noDataMessage="No patients found"
          onRowClick={onRowClick}
          fetchOptions={searchParameters}
        />
      </ContentPane>
    </PageContainer>
  );
};
