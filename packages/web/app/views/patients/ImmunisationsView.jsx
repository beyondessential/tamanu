import React, { useCallback, useEffect, useState } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../contexts/Translation.jsx';
import styled from 'styled-components';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useSocket } from '../../utils/useSocket.js';
import { WS_EVENTS } from '@tamanu/constants';

const StyledSearchTableTitle = styled(SearchTableTitle)`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

/**
 * Gets the latest refresh stats (last refreshed time and cron schedule)
 * and provides a trigger to refresh the upcoming vaccinations table.
 * This is necessary in the logic of the table as the immunisation register
 * requires an expensive query to the upcoming_vaccination view.
 * To get around this we have a materialized view that is periodically refreshed by a scheduled task
 */
const useRefreshStatQuery = () => {
  const api = useApi();
  const { socket } = useSocket();
  const { storedLanguage } = useTranslation();
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const formatAsDistanceToNow = date => formatDistanceToNow(parseISO(date), { addSuffix: 'ago' });

  const handleRefresh = useCallback(() => {
    setLastUpdated(null);
    setRefreshTrigger(count => count + 1);
    queryClient.invalidateQueries(['upcomingVaccinations/refreshStats']);
  }, [queryClient]);

  const { data: refreshStats, isFetching } = useQuery(['upcomingVaccinations/refreshStats'], () =>
    api.get('upcomingVaccinations/refreshStats', { language: storedLanguage }),
  );

  // Update the distance from now text every minute
  useEffect(() => {
    if (!refreshStats) return;
    const interval = setInterval(() => {
      const { lastRefreshed } = refreshStats;
      setLastUpdated(formatAsDistanceToNow(lastRefreshed));
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, [refreshStats, queryClient]);

  // Listen for refresh event from scheduled task
  useEffect(() => {
    if (!socket) return;
    socket.on(WS_EVENTS.UPCOMING_VACCINATIONS_REFRESHED, handleRefresh);
    return () => {
      socket.off('upcomingVaccinationsRefreshed', handleRefresh);
    };
  }, [socket, handleRefresh]);

  return {
    data: refreshStats && {
      schedule: refreshStats.schedule,
      lastUpdated: lastUpdated || formatAsDistanceToNow(refreshStats.lastRefreshed),
    },
    isFetching,
    refreshTrigger,
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
  const { data: refreshStats, isFetching, refreshTrigger } = useRefreshStatQuery();
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
      />
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
          refreshCount={refreshTrigger}
          fetchOptions={searchParameters}
        />
      </ContentPane>
    </PageContainer>
  );
};
