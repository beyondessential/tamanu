import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { WS_EVENTS } from '@tamanu/constants';

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
    <TranslatedText
      stringId="general.fallback.notApplicable"
      fallback="N/A"
      data-test-id='translatedtext-60pd' />
  );

const COLUMNS = [
  displayId,
  {
    key: 'fullName',
    title: <TranslatedText
      stringId="general.patientName.label"
      fallback="Patient name"
      data-test-id='translatedtext-uj04' />,
    accessor: row => `${row.firstName} ${row.lastName}`,
  },
  dateOfBirth,
  sex,
  village,
  {
    key: 'vaccineDisplayName',
    title: <TranslatedText
      stringId="vaccine.table.column.vaccine"
      fallback="Vaccine"
      data-test-id='translatedtext-j8wn' />,
    accessor: getVaccineName,
  },
  {
    key: 'schedule',
    title: <TranslatedText
      stringId="vaccine.table.column.schedule"
      fallback="Schedule"
      data-test-id='translatedtext-hy8u' />,
    accessor: getSchedule,
  },
  {
    key: 'dueDate',
    title: <TranslatedText
      stringId="vaccine.table.column.dueDate"
      fallback="Due date"
      data-test-id='translatedtext-ljvt' />,
    accessor: getDueDate,
  },
  {
    key: 'status',
    title: <TranslatedText
      stringId="vaccine.table.column.status"
      fallback="Status"
      data-test-id='translatedtext-igh1' />,
    accessor: getStatusTag,
    sortable: false,
  },
];

export const ImmunisationsView = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const dispatch = useDispatch();

  // listen to any updates on the root collection, i.e. the first segment of the endpoint
  // updates at the root level indicate anything below needs to be re-fetched
  const rootCollection = 'upcomingVaccinations';
  const endpoint = `${rootCollection}/updateStats`;
  const updateDetectionChannel = `${WS_EVENTS.DATABASE_MATERIALIZED_VIEW_REFRESHED}:${rootCollection}`;

  const { data: updateStats, error } = useAutoUpdatingQuery(endpoint, {}, updateDetectionChannel);

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
          <TranslatedText
            stringId="immunisation.register.title"
            fallback="Immunisation register"
            data-test-id='translatedtext-6xt0' />
        }
        data-test-id='topbar-nnvx' />
      <ContentPane>
        <StyledSearchTableTitle component="div">
          <TranslatedText
            stringId="immunisation.register.search.title"
            fallback="Patient immunisation search"
            data-test-id='translatedtext-jn5w' />

          {updateStats && <UpdateStatsDisplay stats={updateStats} error={error} />}
        </StyledSearchTableTitle>
        <ImmunisationSearchBar onSearch={setSearchParameters} />
        <SearchTableWithPermissionCheck
          endpoint="upcomingVaccinations"
          verb="list"
          noun="PatientVaccine"
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
