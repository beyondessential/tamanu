import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import {
  ContentPane,
  ImmunisationSearchBar,
  PageContainer,
  SearchTableTitle,
  SearchTableWithPermissionCheck,
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
import { UpdateStatsDisplay } from '../../components/Table/UpdateStatsDisplay.jsx';
import { useAutoUpdatingQuery } from '../../api/queries/useAutoUpdatingQuery.js';

const StyledSearchTableTitle = styled(SearchTableTitle)`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

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
  const [refreshCount, setRefreshCount] = useState(0);
  const dispatch = useDispatch();

  const { data: updateStats, error } = useAutoUpdatingQuery('upcomingVaccinations/updateStats');

  const [searchParameters, setSearchParameters] = useState({});
  const { navigateToPatient } = usePatientNavigation();
  const onRowClick = async patient => {
    await dispatch(reloadPatient(patient.id));
    navigateToPatient(patient.id, { tab: PATIENT_TABS.VACCINES });
  };

  useEffect(() => {
    if (!updateStats) return;
    setRefreshCount(count => count + 1);
  }, [updateStats]);

  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText stringId="immunisation.register.title" fallback="Immunisation register" />
        }
      />
      <ContentPane>
        <StyledSearchTableTitle>
          <TranslatedText
            stringId="immunisation.register.search.title"
            fallback="Patient immunisation search"
          />

          {updateStats && <UpdateStatsDisplay stats={updateStats} error={error} />}
        </StyledSearchTableTitle>
        <ImmunisationSearchBar onSearch={setSearchParameters} />
        <SearchTableWithPermissionCheck
          endpoint="upcomingVaccinations"
          verb="list"
          noun="PatientVaccines"
          columns={COLUMNS}
          refreshCount={refreshCount}
          noDataMessage="No upcoming vaccinations found"
          onRowClick={onRowClick}
          fetchOptions={searchParameters}
        />
      </ContentPane>
    </PageContainer>
  );
};
