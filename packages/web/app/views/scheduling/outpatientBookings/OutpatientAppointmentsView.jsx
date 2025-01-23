import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import { startOfDay } from 'date-fns';
import { pick } from 'lodash';
import queryString from 'query-string';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { parseDate } from '@tamanu/utils/dateTime';

import { Button, PageContainer, TopBar, TranslatedText } from '../../../components';
import { CancelAppointmentModal } from '../../../components/Appointments/CancelModal/CancelAppointmentModal';
import { OutpatientAppointmentDrawer } from '../../../components/Appointments/OutpatientsBookingForm/OutpatientAppointmentDrawer';
import { Colors } from '../../../constants';
import { OutpatientAppointmentsContextProvider } from '../../../contexts/OutpatientAppointments';
import { DateSelector } from './DateSelector';
import { GroupByAppointmentToggle } from './GroupAppointmentToggle';
import { OutpatientAppointmentsFilter } from './OutpatientAppointmentsFilter';
import { OutpatientBookingCalendar } from './OutpatientBookingCalendar';
import { NoPermissionScreen } from '../../NoPermissionScreen';
import { useAuth } from '../../../contexts/Auth';

const Container = styled(PageContainer)`
  block-size: 100%;
  display: flex;
  flex-direction: column;
`;

const CalendarWrapper = styled(Box)`
  flex: 1;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  margin: 1rem;
  border-radius: 0.25rem;
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  background: ${Colors.white};
`;

const CalendarInnerWrapper = styled(Box)`
  block-size: 100%;
  display: flex;
  inline-size: 100%;
  overflow: auto;
  border-block-start: max(0.0625rem, 1px) solid ${Colors.outline};
`;

const AppointmentTopBar = styled(TopBar).attrs({
  title: <TranslatedText stringId="scheduling.appointments.title" fallback="Appointments" />,
})`
  border-block-end: max(0.0625rem, 1px) ${Colors.outline} solid;
  flex-grow: 0;
  .MuiToolbar-root {
    justify-content: flex-start;
    gap: 1rem;
  }
  .MuiTypography-root {
    flex: 0;
    min-inline-size: 7.188rem;
  }
`;

const GroupByToggle = styled(GroupByAppointmentToggle)`
  margin-inline-end: auto;
`;

export const APPOINTMENT_GROUP_BY = {
  LOCATION_GROUP: 'locationGroupId',
  CLINICIAN: 'clinicianId',
};

export const OutpatientAppointmentsView = () => {
  const { ability } = useAuth();
  const location = useLocation();
  const defaultGroupBy =
    new URLSearchParams(location.search).get('groupBy') || APPOINTMENT_GROUP_BY.LOCATION_GROUP;

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [groupBy, setGroupBy] = useState(defaultGroupBy);

  useEffect(() => {
    const { patientId, date } = queryString.parse(location.search);
    if (patientId) {
      setSelectedAppointment({ patientId });
      setDrawerOpen(true);
    }
    if (date) {
      setSelectedDate(parseDate(date));
    }
  }, [location.search]);

  const handleChangeDate = event => {
    setSelectedDate(event.target.value);
  };

  const handleOpenCancelModal = appointment => {
    setSelectedAppointment(appointment);
    setIsCancelModalOpen(true);
  };

  const handleCloseDrawer = () => setDrawerOpen(false);

  const handleOpenDrawer = appointment => {
    const appointmentFormValues = pick(appointment, [
      'id',
      'locationGroupId',
      'appointmentTypeId',
      'startTime',
      'endTime',
      'patientId',
      'clinicianId',
      'isHighPriority',
      'schedule',
    ]);
    setSelectedAppointment({
      ...appointmentFormValues,
      isRepeatingAppointment: !!appointmentFormValues.schedule,
    });
    setDrawerOpen(true);
  };

  const canCreateAppointment = ability.can('create', 'Appointment');
  const canViewAppointments = ability.can('listOrRead', 'Appointment');

  if (!canViewAppointments) {
    return <NoPermissionScreen />;
  }

  return (
    <Container>
      <OutpatientAppointmentsContextProvider>
        <CancelAppointmentModal
          appointment={selectedAppointment}
          open={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
        />
        <AppointmentTopBar>
          <GroupByToggle value={groupBy} onChange={setGroupBy} />
          <OutpatientAppointmentsFilter />
          {canCreateAppointment && (
            <Button onClick={() => handleOpenDrawer({})}>
              <AddIcon aria-hidden /> Book appointment
            </Button>
          )}
        </AppointmentTopBar>
        <CalendarWrapper>
          <DateSelector value={selectedDate} onChange={handleChangeDate} />
          <CalendarInnerWrapper>
            <OutpatientBookingCalendar
              onCancel={handleOpenCancelModal}
              onOpenDrawer={handleOpenDrawer}
              groupBy={groupBy}
              selectedDate={selectedDate}
            />
            <OutpatientAppointmentDrawer
              initialValues={selectedAppointment}
              key={selectedAppointment.id}
              onClose={handleCloseDrawer}
              open={drawerOpen}
            />
          </CalendarInnerWrapper>
        </CalendarWrapper>
      </OutpatientAppointmentsContextProvider>
    </Container>
  );
};
