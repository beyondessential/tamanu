import React, { useState } from 'react';

import { TopBar, PageContainer, DataFetchingTable } from '../../components';
import { DateDisplay } from '../../components/DateDisplay';
import NewAppointmentButton from '../../components/Appointments/NewAppointmentButton';

const COLUMNS = [
  {
    key: 'date',
    title: 'Date',
    accessor: row => <DateDisplay date={row.startTime} showTime />,
  },
  {
    key: 'patientName',
    title: 'Patient',
    accessor: row => `${row.patient.firstName} ${row.patient.lastName}`,
  },
  {
    key: 'practitioner',
    title: 'Clinician',
    accessor: row => `${row.clinician && row.clinician.displayName}`,
  },
  { key: 'location', title: 'Location', accessor: row => row.location.name },
];

export const AppointmentListingView = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  return (
    <PageContainer>
      <TopBar title="Appointments">
        <NewAppointmentButton onSuccess={() => setRefreshCount(refreshCount + 1)} />
      </TopBar>
      <DataFetchingTable
        endpoint="appointments"
        columns={COLUMNS}
        noDataMessage="No appointments found"
        initialSort={{ order: 'asc', orderBy: 'startTime' }}
        refreshCount={refreshCount}
      />
    </PageContainer>
  );
};
