import React from 'react';
import styled from 'styled-components';

import { TopBar, PageContainer, DataFetchingTable } from '../components';
import { DateDisplay } from '../components/DateDisplay';
import { LiveDurationDisplay } from '../components/LiveDurationDisplay';
import { TriageActionDropdown } from '../components/TriageActionDropdown';
import { triagePriorities } from '../constants';

const StatusDisplay = React.memo(({ visit, closedTime }) => {
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
  background: ${p => p.color};
  color: white;
  font-weight: bold;
  display: block;
  width: 100%;
  text-align: center;
`;

const PriorityDisplay = React.memo(({ score, startTime, endTime }) => {
  const priority = triagePriorities.find(x => x.value === score);
  return (
    <PriorityText color={priority.color}>
      <div>
        <LiveDurationDisplay startTime={startTime} endTime={endTime} />
      </div>
      <div>Triage at xx:xxpm</div>
    </PriorityText>
  );
});

const COLUMNS = [
  {
    key: 'score',
    title: 'Wait time',
    accessor: row => (
      <PriorityDisplay score={row.score} startTime={row.triageTime} endTime={row.closedTime} />
    ),
  },
  {
    key: 'reasonForVisit',
    title: 'Reason for visit',
    accessor: row => row.reasonForVisit || '',
  },
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
  {
    key: 'status',
    title: 'Status',
    accessor: row => (
      <StatusDisplay status={row.status} visit={row.visit} closedTime={row.closedTime} />
    ),
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
    <TopBar title="Emergency waiting list" />
    <TriageTable />
  </PageContainer>
));
