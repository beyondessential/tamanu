import React from 'react';
import { TopBar, PageContainer, DataFetchingTable } from '../components';
import { DateDisplay } from '../components/DateDisplay';
import { LiveDurationDisplay } from '../components/LiveDurationDisplay';

const COLUMNS = [
  { key: '_id', title: 'ID' },
  { key: 'patientName', title: 'Patient', accessor: row => `${row.patient[0].firstName} ${row.patient[0].lastName}` },
  { key: 'patientDoB', title: 'Date of birth', accessor: row => <DateDisplay date={row.patient[0].dateOfBirth} /> },
  { key: 'patientSex', title: 'Sex', accessor: row => row.patient[0].sex },
  { key: 'score', title: 'Triage score' },
  { key: 'status', title: 'Status' },
  { key: 'location', title: 'Location', accessor: row => row.location.name },
  { key: 'waitingTime', title: 'Waiting time', accessor: row => <LiveDurationDisplay startTime={row.triageTime} /> },
];

const TriageTable = React.memo(({ ...props }) => (
  <DataFetchingTable
    endpoint="triage/search"
    columns={COLUMNS}
    noDataMessage="No patients found"
    {...props}
  />
));

export const TriageListingView = React.memo(() => {
  return (
    <PageContainer>
      <TopBar title="Emergency waiting list" />
      <TriageTable />
    </PageContainer>
  );
});
