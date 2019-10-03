import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { TopBar, PageContainer, DataFetchingTable } from '../components';
import { TriageStatisticsCard } from '../components/TriageStatisticsCard';

import { DateDisplay } from '../components/DateDisplay';
import { LiveDurationDisplay } from '../components/LiveDurationDisplay';
import { TriageActionDropdown } from '../components/TriageActionDropdown';
import { TRIAGE_COLORS_BY_LEVEL } from '../constants';

const PriorityText = styled.span`
  background: ${p => p.color};
  color: white;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: center;
`;

const ADMITTED_PRIORITY = {
  color: '#bdbdbd',
};

const StatusDisplay = React.memo(({ visit, startTime, closedTime }) => {
  if (!closedTime) {
    return (
      <React.Fragment>
        <LiveDurationDisplay startTime={startTime} />
        <small>{`Triage at ${moment(startTime).format('h:mma')}`}</small>
      </React.Fragment>
    );
  }

  if (visit) {
    if (visit.visitType === 'observation') {
      return 'Seen';
    }
    return 'Admitted';
  }

  return 'Discharged';
});

const PriorityDisplay = React.memo(({ score, startTime, visit, closedTime }) => {
  const color = visit ? ADMITTED_PRIORITY.color : TRIAGE_COLORS_BY_LEVEL[score];

  return (
    <PriorityText color={color}>
      <StatusDisplay visit={visit} startTime={startTime} closedTime={closedTime} />
    </PriorityText>
  );
});

const COLUMNS = [
  {
    key: 'score',
    title: 'Wait time',
    cellColor: row => (row.visit ? ADMITTED_PRIORITY.color : TRIAGE_COLORS_BY_LEVEL[row.score]),
    accessor: row => (
      <PriorityDisplay
        score={row.score}
        startTime={row.triageTime}
        closedTime={row.closedTime}
        visit={row.visit}
      />
    ),
  },
  {
    key: 'reasonForVisit',
    title: 'Reason for visit',
    accessor: row => row.reasonForVisit || '',
  },
  { key: '_id', title: 'ID', accessor: row => row.patient[0]._id },
  {
    key: 'patientName',
    title: 'Patient',
    accessor: row => `${row.patient[0].firstName} ${row.patient[0].lastName}`,
  },
  {
    key: 'patientDoB',
    title: 'Date of birth',
    accessor: row => <DateDisplay date={row.patient[0].dateOfBirth} />,
  },
  {
    key: 'patientSex',
    title: 'Sex',
    accessor: row => {
      const sex = row.patient[0].sex || '';
      return sex.slice(0, 1).toUpperCase() + sex.slice(1);
    },
  },
  { key: 'location', title: 'Location', accessor: row => row.location.name },
  { key: 'actions', title: 'Actions', accessor: row => <TriageActionDropdown triage={row} /> },
];

const TriageTable = React.memo(({ ...props }) => (
  <DataFetchingTable
    endpoint="triage"
    columns={COLUMNS}
    noDataMessage="No patients found"
    {...props}
  />
));

export const TriageListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Emergency Department" />
    <TriageStatisticsCard priorityLevel={2} />
    <TriageTable />
  </PageContainer>
));
