import React, { useState } from 'react';
import { pick } from 'lodash';
import { startOfDay } from 'date-fns';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';

import { Button, PageContainer, TopBar, TranslatedText } from '../../../components';
import { DateSelector } from './DateSelector';
import { Colors } from '../../../constants';
import { OutpatientBookingCalendar } from './OutpatientBookingCalendar';
import { GroupByAppointmentToggle } from './GroupAppointmentToggle';
import { OutpatientAppointmentDrawer } from '../../../components/Appointments/OutpatientsBookingForm/OutpatientAppointmentDrawer';

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  max-block-size: 100%;
  border: 1px solid oklch(0% 0 0 / 15%);
  border-radius: 0.2rem;
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 1rem;
  padding: 0.5rem;
  place-items: center;
  text-align: center;
`;

const Container = styled(PageContainer)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CalendarWrapper = styled(Box)`
  flex: 1;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  margin: 1rem;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const CalendarInnerWrapper = styled(Box)`
  display: flex;
  height: 100%;
  width: 100%;
  overflow: auto;
  border-block-start: 1px solid ${Colors.outline};
`;

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: <TranslatedText stringId="scheduling.appointments.title" fallback="Appointments" />,
})`
  flex-grow: 0;
  & .MuiTypography-root {
    flex: 0;
  }
`;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
`;

const NewBookingButton = styled(Button)`
  margin-left: 1rem;
`;

export const APPOINTMENT_GROUP_BY = {
  LOCATION_GROUP: 'locationGroupId',
  CLINICIAN: 'clinicianId',
};

export const OutpatientAppointmentsView = () => {
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [groupBy, setGroupBy] = useState(APPOINTMENT_GROUP_BY.LOCATION_GROUP);

  const handleChangeDate = event => {
    setSelectedDate(event.target.value);
  };

  const handleCloseDrawer = () => setDrawerOpen(false);

  const handleOpenDrawer = appointment => {
    setSelectedAppointment(
      pick(appointment, [
        'id',
        'locationGroupId',
        'appointmentTypeId',
        'startTime',
        'endTime',
        'patientId',
        'clinicianId',
      ]),
    );
    setDrawerOpen(true);
  };

  return (
    <Container>
      <OutpatientAppointmentDrawer
        initialValues={selectedAppointment}
        onClose={handleCloseDrawer}
        open={drawerOpen}
      />
      <LocationBookingsTopBar>
        <GroupByAppointmentToggle value={groupBy} onChange={setGroupBy} />
        <Filters>
          <Placeholder>Search</Placeholder>
          <Placeholder>Clinician</Placeholder>
          <Placeholder>Type</Placeholder>
        </Filters>
        <NewBookingButton onClick={() => handleOpenDrawer({})}>
          <AddIcon /> Book appointment
        </NewBookingButton>
      </LocationBookingsTopBar>
      <CalendarWrapper>
        <DateSelector value={selectedDate} onChange={handleChangeDate} />
        <CalendarInnerWrapper>
          <OutpatientBookingCalendar
            onOpenDrawer={handleOpenDrawer}
            groupBy={groupBy}
            selectedDate={selectedDate}
          />
        </CalendarInnerWrapper>
      </CalendarWrapper>
    </Container>
  );
};
