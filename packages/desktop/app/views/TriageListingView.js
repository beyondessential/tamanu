import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';

import { connect } from 'react-redux';

import { viewPatientVisit } from '../store/patient';

import { TopBar, PageContainer, DataFetchingTable } from '../components';
import { TriageStatisticsCard } from '../components/TriageStatisticsCard';

import { DateDisplay } from '../components/DateDisplay';
import { LiveDurationDisplay } from '../components/LiveDurationDisplay';
import { TRIAGE_COLORS_BY_LEVEL } from '../constants';
import { capitaliseFirstLetter } from '../utils/capitalise';

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

const StatusDisplay = React.memo(({ visitType, startTime }) => {
  switch (visitType) {
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

const PriorityDisplay = React.memo(({ startTime, visitType, closedTime }) => (
  <PriorityText>
    <StatusDisplay visitType={visitType} startTime={startTime} closedTime={closedTime} />
  </PriorityText>
));

function getRowColor({ visitType, score }) {
  switch (visitType) {
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
        visitType={row.visitType}
      />
    ),
  },
  {
    key: 'chiefComplaint',
    title: 'Chief complaint',
    accessor: row => row.chiefComplaint,
  },
  { key: 'id', title: 'ID', accessor: row => row.displayId },
  {
    key: 'patientName',
    title: 'Patient',
    accessor: row => `${row.firstName} ${row.lastName}`,
  },
  {
    key: 'dateOfBirth',
    title: 'Date of birth',
    accessor: row => <DateDisplay date={row.dateOfBirth} />,
  },
  {
    key: 'sex',
    title: 'Sex',
    accessor: row => {
      const sex = row.sex || '';
      return capitaliseFirstLetter(sex);
    },
  },
  { key: 'locationName',
	title: 'Location', 
	accessor: row => row.locationName },
];

const TriageTable = connect(
  null,
  dispatch => ({
    onViewVisit: triage => dispatch(viewPatientVisit(triage.patientId, triage.visitId))
  }),
)(
  React.memo(({ onViewVisit, ...props }) => (
    <DataFetchingTable
      endpoint="triage"
      columns={COLUMNS}
      noDataMessage="No patients found"
      onRowClick={onViewVisit}
      {...props}
    />
  )),
);

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
