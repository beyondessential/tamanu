import React, { useState, useCallback } from 'react';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../components';
import { PatientActionDropdown } from '../components/PatientActionDropdown';
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
  {
    key: 'actions',
    title: 'Actions',
    accessor: row => (<div></div>),
  },
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
  const [searchParameters, setSearchParameters] = useState({});
  const [creatingPatient, setCreatingPatient] = useState(false);

  const toggleCreatingPatient = useCallback(() => {
    setCreatingPatient(!creatingPatient);
  }, [creatingPatient]);

  return (
    <PageContainer>
      <TopBar title="Emergency waiting list" />
      <TriageTable fetchOptions={searchParameters} />
    </PageContainer>
  );
});
