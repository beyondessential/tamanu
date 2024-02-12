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
} from '../../components';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { useRefreshCount } from '../../hooks/useRefreshCount';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const CapitalisedValue = styled.span`
  text-transform: capitalize;
`;

export const AppointmentListingView = () => {
  const COLUMNS = [
    {
      key: 'startTime',
      title: <TranslatedText stringId='general.date.label' fallback="Date" />,
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
      title: <TranslatedText stringId='general.patient.label' fallback="Patient" />,
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
      title: <TranslatedText stringId="general.area.label" fallback="Area" />,
      accessor: row => row.locationGroup.name,
    },
    { key: 'type', title: <TranslatedText stringId="general.type.label" fallback="Type" /> },
    { key: 'status', title: <TranslatedText stringId="general.status.label" fallback="Status" /> },
  ];

  const [searchParams, setSearchParams] = useState({});
  const [refreshCount, updateRefreshCount] = useRefreshCount();

  return (
    <PageContainer>
      <TopBar title={<TranslatedText stringId="appointments.heading" fallback="Appointments" />}>
        <NewAppointmentButton onSuccess={updateRefreshCount} />
      </TopBar>
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText stringId="appointments.search.heading" fallback="Appointment search" />
        </SearchTableTitle>
        <AppointmentsSearchBar onSearch={setSearchParams} />
        <SearchTable
          endpoint="appointments"
          columns={COLUMNS}
          noDataMessage={
            <TranslatedText
              stringId="appointments.table.noDataMessage"
              fallback="No appointments found"
            />
          }
          initialSort={{ order: 'asc', orderBy: 'startTime' }}
          fetchOptions={searchParams}
          refreshCount={refreshCount}
        />
      </ContentPane>
    </PageContainer>
  );
};
