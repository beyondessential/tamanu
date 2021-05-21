import React, { useCallback } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';
import { connect } from 'react-redux';

import { viewPatientEncounter } from '../store/patient';
import { ConfigurableText, TopBar, PageContainer, DataFetchingTable } from '../components';
import { TriageStatisticsCard } from '../components/TriageStatisticsCard';
import { DateDisplay } from '../components/DateDisplay';
import { LiveDurationDisplay } from '../components/LiveDurationDisplay';
import { TRIAGE_COLORS_BY_LEVEL } from '../constants';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { useEncounter } from '../contexts/Encounter';

const PriorityText = styled.span`
  color: white;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: center;
`;

const StatisticsRow = styled(Paper)`
  display: flex;
  margin: 16px 16px 0 16px;
  width: fit-content;

  > div {
    &:first-child {
      div:first-of-type {
        border-top-left-radius: 3px;
      }
      div:last-of-type {
        border-bottom-left-radius: 3px;
      }
    }

    &:last-child {
      div:first-of-type {
        border-top-right-radius: 3px;
      }
      div:last-of-type {
        border-bottom-right-radius: 3px;
      }
    }

    &:last-child {
      border-radius: 0 3px 3px 0;
    }

    &:not(:last-of-type) {
      div:last-child {
        border-right: none;
      }
    }
  }
`;

const ADMITTED_PRIORITY = {
  color: '#bdbdbd',
};

const StatusDisplay = React.memo(({ encounterType, startTime }) => {
  switch (encounterType) {
    case 'triage':
      return (
        <React.Fragment>
          <LiveDurationDisplay startTime={startTime} />
          <small>{`Triage at ${moment(startTime).format('h:mma')}`}</small>
        </React.Fragment>
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
  { key: 'locationName' },
];

const DumbTriageTable = React.memo(({ onViewEncounter, ...props }) => {
  const { loadEncounter } = useEncounter();
  const viewEncounter = useCallback(async triage => {
    await loadEncounter(triage.encounterId);
    onViewEncounter(triage);
  }, []);

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

const TriageTable = connect(null, dispatch => ({
  onViewEncounter: triage => dispatch(viewPatientEncounter(triage.patientId, triage.encounterId)),
}))(DumbTriageTable);

export const TriageListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Emergency Department" />
    <StatisticsRow>
      <TriageStatisticsCard priorityLevel={1} />
      <TriageStatisticsCard priorityLevel={2} />
      <TriageStatisticsCard priorityLevel={3} />
    </StatisticsRow>
    <TriageTable />
  </PageContainer>
));
