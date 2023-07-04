import React, { useState } from 'react';
import styled from 'styled-components';
import {
  TopBar,
  DateDisplay,
  PageContainer,
  DataFetchingTable,
  AppointmentsSearchBar,
  ContentPane,
} from '../../components';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';

const CapitalisedValue = styled.span`
  text-transform: capitalize;
`;

const COLUMNS = [
  {
    key: 'startTime',
    title: 'Date',
    accessor: row => <DateDisplay date={row.startTime} showTime />,
  },
  {
    key: 'displayId',
    accessor: row => row.patient.displayId,
  },
  {
    key: 'patientName',
    title: 'Patient',
    accessor: row => `${row.patient.firstName} ${row.patient.lastName}`,
  },
  {
    key: 'sex',
    accessor: row => <CapitalisedValue>{row.patient.sex}</CapitalisedValue>,
  },
  {
    key: 'dateOfBirth',
    accessor: row => <DateDisplay date={row.patient.dateOfBirth} />,
  },
  {
    key: 'clinicianId',
    title: 'Clinician',
    accessor: row => `${row.clinician && row.clinician.displayName}`,
  },
  { key: 'locationId', title: 'Location', accessor: row => row.location.name },
  { key: 'type', title: 'Type' },
  { key: 'status', title: 'Status' },
];

export const AppointmentListingView = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [searchParams, setSearchParams] = useState({});
  return (
    <PageContainer>
      <TopBar title="Appointments">
        <NewAppointmentButton onSuccess={() => setRefreshCount(refreshCount + 1)} />
      </TopBar>
      <AppointmentsSearchBar onSearch={setSearchParams} />
      <ContentPane>
        <DataFetchingTable
          endpoint="appointments"
          columns={COLUMNS}
          noDataMessage="No appointments found"
          initialSort={{ order: 'asc', orderBy: 'startTime' }}
          fetchOptions={searchParams}
          refreshCount={refreshCount}
        />
      </ContentPane>
    </PageContainer>
  );
};
