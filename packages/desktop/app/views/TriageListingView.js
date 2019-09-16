import React from 'react';
import styled from 'styled-components';

import { TopBar, PageContainer, DataFetchingTable } from '../components';
import { DateDisplay } from '../components/DateDisplay';
import { LiveDurationDisplay } from '../components/LiveDurationDisplay';
import { TriageActionDropdown } from '../components/TriageActionDropdown';
import { triagePriorities } from '../constants';

const StatusDisplay = React.memo(({ status, visit, closedTime }) => {
  if (!closedTime) {
    return 'Waiting';
  }

  if (visit) {
    if (visit.visitType === 'observation') {
      return 'Seen';
    }
    return 'Admitted';
  }

  return 'Discharged';
});

const PriorityText = styled.span`
  color: ${p => p.color};
`;

const PriorityDisplay = React.memo(({ score }) => {
  const priority = triagePriorities.find(x => x.value === score);
  return <PriorityText color={priority.color}>{`${score} (${priority.label})`}</PriorityText>;
});

const COLUMNS = [
  { key: '_id', title: 'ID' },
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
  { key: 'patientSex', title: 'Sex', accessor: row => row.patient[0].sex },
  { key: 'score', title: 'Triage score', accessor: row => <PriorityDisplay score={row.score} /> },
  {
    key: 'status',
    title: 'Status',
    accessor: row => (
      <StatusDisplay status={row.status} visit={row.visit} closedTime={row.closedTime} />
    ),
  },
  { key: 'location', title: 'Location', accessor: row => row.location.name },
  {
    key: 'waitingTime',
    title: 'Waiting time',
    accessor: row => <LiveDurationDisplay startTime={row.triageTime} endTime={row.closedTime} />,
  },
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
    <TopBar title="Emergency waiting list" />
    <TriageTable />
  </PageContainer>
));
