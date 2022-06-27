import React, { useCallback } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { reloadPatient } from '../store/patient';
import { TRIAGE_COLORS_BY_LEVEL } from '../constants';

import { TopBar, PageContainer, DataFetchingTable, ContentPane } from '../components';
import { TriageStatisticsCard } from '../components/TriageStatisticsCard';
import { DateDisplay } from '../components/DateDisplay';
import { LiveDurationDisplay } from '../components/LiveDurationDisplay';

const PriorityText = styled.span`
  color: white;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: center;
`;

const StatisticsRow = styled.div`
  display: flex;
  margin: 16px 0 30px 0;
  filter: drop-shadow(2px 2px 25px rgba(0, 0, 0, 0.1));
`;

const ADMITTED_PRIORITY = {
  color: '#bdbdbd',
};

const StatusDisplay = React.memo(({ encounterType, startTime }) => {
  switch (encounterType) {
    case 'triage':
      return (
        <>
          <LiveDurationDisplay startTime={startTime} />
          <small>{`Triage at ${moment(startTime).format('h:mma')}`}</small>
        </>
      );
    case 'observation':
      return 'Seen';
    default:
      return 'Admitted';
  }
});

const PriorityDisplay = React.memo(({ startTime, encounterType, closedTime }) => (
  <PriorityText>
    <StatusDisplay encounterType={encounterType} startTime={startTime} closedTime={closedTime} />
  </PriorityText>
));

function getRowColor({ encounterType, score }) {
  switch (encounterType) {
    case 'triage':
      return TRIAGE_COLORS_BY_LEVEL[score];
    default:
      return ADMITTED_PRIORITY.color;
  }
}

const COLUMNS = [
  {
    key: 'score',
    title: 'Wait time',
    cellColor: getRowColor,
    accessor: row => (
      <PriorityDisplay
        score={row.score}
        startTime={row.triageTime}
        closedTime={row.closedTime}
        encounterType={row.encounterType}
      />
    ),
  },
  { key: 'chiefComplaint', title: 'Chief complaint' },
  { key: 'displayId' },
  { key: 'patientName', title: 'Patient', accessor: row => `${row.firstName} ${row.lastName}` },
  { key: 'dateOfBirth', accessor: row => <DateDisplay date={row.dateOfBirth} /> },
  {
    key: 'sex',
    accessor: row => {
      const sex = row.sex || '';
      return capitaliseFirstLetter(sex);
    },
  },
  { key: 'locationName', title: 'Location' },
];

const TriageTable = React.memo(({ onViewEncounter, ...props }) => {
  const dispatch = useDispatch();
  const { loadEncounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();

  const viewEncounter = useCallback(
    async triage => {
      await loadEncounter(triage.encounterId);
      await dispatch(reloadPatient(triage.patientId));
      navigateToEncounter(triage.encounterId);
    },
    [loadEncounter, dispatch, navigateToEncounter],
  );

  return (
    <DataFetchingTable
      endpoint="triage"
      columns={COLUMNS}
      noDataMessage="No patients found"
      onRowClick={viewEncounter}
      {...props}
    />
  );
});

export const TriageListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Emergency department" />
    <ContentPane>
      <StatisticsRow>
        <TriageStatisticsCard priorityLevel={1} />
        <TriageStatisticsCard priorityLevel={2} />
        <TriageStatisticsCard priorityLevel={3} />
      </StatisticsRow>
      <TriageTable />
    </ContentPane>
  </PageContainer>
));
