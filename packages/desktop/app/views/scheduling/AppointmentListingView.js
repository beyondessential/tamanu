import React, { useState } from 'react';
import styled from 'styled-components';
import {
  TopBar,
  DateDisplay,
  PageContainer,
  AppointmentsSearchBar,
  ContentPane,
  SearchTableTitle,
  SearchTable,
} from '../../components';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const CapitalisedValue = styled.span`
  text-transform: capitalize;
`;

export const AppointmentListingView = () => {
  const COLUMNS = [
    {
      key: 'startTime',
      title: 'Date',
      accessor: row => <DateDisplay date={row.startTime} showTime />,
    },
    {
      key: 'displayId',
      title: (
        <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="DOB" />
      ),
      accessor: row => row.patient.displayId,
    },
    {
      key: 'patientName',
      title: 'Patient',
      accessor: row => `${row.patient.firstName} ${row.patient.lastName}`,
    },
    {
      key: 'sex',
      title: <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
      accessor: row => <CapitalisedValue>{row.patient.sex}</CapitalisedValue>,
    },
    {
      key: 'dateOfBirth',
      title: (
        <TranslatedText stringId="general.localisedField.dateOfBirth.label.short" fallback="DOB" />
      ),
      accessor: row => <DateDisplay date={row.patient.dateOfBirth} />,
    },
    {
      key: 'clinicianId',
      title: (
        <TranslatedText stringId="general.localisedField.clinician.label" fallback="Clinician" />
      ),
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

  const [refreshCount, setRefreshCount] = useState(0);
  const [searchParams, setSearchParams] = useState({});
  return (
    <PageContainer>
      <TopBar title="Appointments">
        <NewAppointmentButton onSuccess={() => setRefreshCount(refreshCount + 1)} />
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
