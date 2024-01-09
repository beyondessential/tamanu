import React, { useState } from 'react';
import styled from 'styled-components';
import {
  AppointmentsSearchBar,
  ContentPane,
  DateDisplay,
  PageContainer,
  SearchTable,
  SearchTableTitle,
  TopBar,
  useLocalisedText,
} from '../../components';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { useRefreshCount } from '../../hooks/useRefreshCount';

const CapitalisedValue = styled.span`
  text-transform: capitalize;
`;

export const AppointmentListingView = () => {
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
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
      title: clinicianText,
      accessor: row => `${row.clinician && row.clinician.displayName}`,
    },
    {
      key: 'locationGroupId',
      title: 'Area',
      accessor: row => row.locationGroup.name,
    },
    { key: 'type', title: 'Type' },
    { key: 'status', title: 'Status' },
  ];

  const [searchParams, setSearchParams] = useState({});
  const [refreshCount, updateRefreshCount] = useRefreshCount();

  return (
    <PageContainer>
      <TopBar title="Appointments">
        <NewAppointmentButton onSuccess={updateRefreshCount} />
      </TopBar>
      <ContentPane>
        <SearchTableTitle>Appointment search</SearchTableTitle>
        <AppointmentsSearchBar onSearch={setSearchParams} />
        <SearchTable
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
