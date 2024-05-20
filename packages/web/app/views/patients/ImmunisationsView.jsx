import React, { useEffect, useState } from 'react';
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
import { RefreshStatsDisplay } from '../../components/Table/RefreshStatsDisplay.jsx';
import { useApi } from '../../api/useApi.js';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../contexts/Translation.jsx';
import styled from 'styled-components';
import { formatDistanceToNow, parseISO } from 'date-fns';

const StyledSearchTableTitle = styled(SearchTableTitle)`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const useRefreshStatsQuery = () => {
  const [lastUpdated, setLastUpdated] = useState();
  const { storedLanguage } = useTranslation();
  const api = useApi();
  const { data: refreshStats, isFetching } = useQuery(['upcomingVaccinations/refreshStats'], () =>
    api.get('upcomingVaccinations/refreshStats', { language: storedLanguage }),
  );

  const getFromNowText = lastRefreshed =>
    formatDistanceToNow(parseISO(lastRefreshed), { addSuffix: 'ago' });

  useEffect(() => {
    if (!refreshStats) return;
    const interval = setInterval(() => {
      setLastUpdated(getFromNowText(refreshStats.lastRefreshed));
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    data: refreshStats && {
      schedule: refreshStats.schedule,
      lastUpdated: lastUpdated || getFromNowText(refreshStats.lastRefreshed),
    },
    isFetching,
  };
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
  const dispatch = useDispatch();
  const { data: refreshStats, isFetching } = useRefreshStatsQuery();
  const [searchParameters, setSearchParameters] = useState({});
  const { navigateToPatient } = usePatientNavigation();
  const onRowClick = async patient => {
    await dispatch(reloadPatient(patient.id));
    navigateToPatient(patient.id, { tab: PATIENT_TABS.VACCINES });
  };
  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText stringId="immunisation.register.title" fallback="Immunisation register" />
        }
      ></TopBar>
      <ContentPane>
        <StyledSearchTableTitle>
          <TranslatedText
            stringId="immunisation.register.search.title"
            fallback="Patient immunisation search"
          />
          <RefreshStatsDisplay stats={refreshStats} isFetching={isFetching} />
        </StyledSearchTableTitle>
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
