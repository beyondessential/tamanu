import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import { parseISO } from 'date-fns';
import { omit, pick } from 'lodash';
import queryString from 'query-string';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import styled from 'styled-components';

import { parseDate } from '@tamanu/utils/dateTime';
import { MODIFY_REPEATING_APPOINTMENT_MODE } from '@tamanu/constants';

import { PageContainer, TopBar } from '../../../components';
import { CancelAppointmentModal } from '../../../components/Appointments/CancelModal/CancelAppointmentModal';
import { OutpatientAppointmentDrawer } from '../../../components/Appointments/OutpatientsBookingForm/OutpatientAppointmentDrawer';
import { Button, TranslatedText, useDateTime } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { OutpatientAppointmentsContextProvider } from '../../../contexts/OutpatientAppointments';
import { DateSelector } from './DateSelector';
import { GroupByAppointmentToggle } from './GroupAppointmentToggle';
import { OutpatientAppointmentsFilter } from './OutpatientAppointmentsFilter';
import { OutpatientBookingCalendar } from './OutpatientBookingCalendar';
import { NoPermissionScreen } from '../../NoPermissionScreen';
import { useAuth } from '../../../contexts/Auth';
import { CreateFromExistingConfirmModal } from './CreateFromExistingConfirmModal';
import { ModifyRepeatingAppointmentModal } from '../../../components/Appointments/OutpatientsBookingForm/ModifyRepeatingAppointmentModal';

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
  title: (
    <TranslatedText
      stringId="scheduling.appointments.title"
      fallback="Appointments"
      data-testid="translatedtext-5my0"
    />
  ),
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
  const { getCurrentDate } = useDateTime();
  const location = useLocation();
  const canCreateAppointment = ability.can('create', 'Appointment');
  const canViewAppointments = ability.can('listOrRead', 'Appointment');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [isCreateFromExistingWarningOpen, setIsCreateFromExistingWarningOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => parseISO(getCurrentDate()));
  const [modifyMode, setModifyMode] = useState('');

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

  const handleSelectAppointment = appointment => {
    setSelectedAppointment(
      pick(appointment, [
        'id',
        'locationGroupId',
        'appointmentTypeId',
        'startTime',
        'endTime',
        'patientId',
        'clinicianId',
        'isHighPriority',
        'schedule',
      ]),
    );
  };

  const handleModifyAppointment = appointment => {
    handleSelectAppointment(appointment);
    if (!appointment.schedule) {
      handleOpenDrawer();
      return;
    }
    setModifyMode(MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT);
    setIsModifyModalOpen(true);
  };

  const handleCreateFromExistingAppointment = appointment => {
    handleSelectAppointment(omit(appointment, ['id', 'schedule', 'startTime', 'endTime']));
    if (!appointment.schedule) {
      handleOpenDrawer();
      return;
    }
    setIsCreateFromExistingWarningOpen(true);
  };

  const handleCreateAppointment = () => {
    handleSelectAppointment({});
    handleOpenDrawer();
  };

  const handleOpenDrawer = () => {
    setModifyMode(null);
    setDrawerOpen(true);
  };

  const handleConfirmCreateFromExisting = () => {
    setIsCreateFromExistingWarningOpen(false);
    setDrawerOpen(true);
  };

  const handleCloseCreateFromExisting = () => {
    setDrawerOpen(false);
    setIsCreateFromExistingWarningOpen(false);
  };

  const handleConfirmModifyMode = () => {
    setIsModifyModalOpen(false);
    setDrawerOpen(true);
  };

  const handleCloseConfirmModifyMode = () => {
    setDrawerOpen(false);
    setIsModifyModalOpen(false);
  };

  if (!canViewAppointments) {
    return <NoPermissionScreen data-testid="nopermissionscreen-fisi" />;
  }

  return (
    <Container data-testid="container-1u1o">
      <OutpatientAppointmentsContextProvider data-testid="outpatientappointmentscontextprovider-0z3q">
        <CreateFromExistingConfirmModal
          open={isCreateFromExistingWarningOpen}
          onCancel={handleCloseCreateFromExisting}
          onConfirm={handleConfirmCreateFromExisting}
          data-testid="createfromexistingconfirmmodal-zdyl"
        />

        <CancelAppointmentModal
          appointment={selectedAppointment}
          open={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          data-testid="cancelappointmentmodal-45n1"
        />
        <ModifyRepeatingAppointmentModal
          open={isModifyModalOpen}
          modifyMode={modifyMode}
          onChangeModifyMode={setModifyMode}
          onClose={handleCloseConfirmModifyMode}
          onConfirm={handleConfirmModifyMode}
          data-testid="modifyrepeatingappointmentmodal-vrsy"
        />
        <AppointmentTopBar data-testid="appointmenttopbar-0bbn">
          <GroupByToggle data-testid="groupbytoggle-ps0g" />
          <OutpatientAppointmentsFilter data-testid="outpatientappointmentsfilter-j00q" />
          {canCreateAppointment && (
            <Button onClick={handleCreateAppointment} data-testid="button-3btn">
              <AddIcon aria-hidden data-testid="addicon-iv7z" />{' '}
              <TranslatedText
                stringId="scheduling.action.bookAppointment"
                fallback="Book appointment"
                data-testid="translatedtext-szo6"
              />
            </Button>
          )}
        </AppointmentTopBar>
        <CalendarWrapper data-testid="calendarwrapper-pnm8">
          <DateSelector
            value={selectedDate}
            onChange={handleChangeDate}
            data-testid="dateselector-0f1v"
          />
          <CalendarInnerWrapper data-testid="calendarinnerwrapper-jgre">
            <OutpatientBookingCalendar
              onCancel={handleOpenCancelModal}
              onCreateFromExisting={handleCreateFromExistingAppointment}
              onModify={handleModifyAppointment}
              selectedDate={selectedDate}
              data-testid="outpatientbookingcalendar-s73y"
            />
            <OutpatientAppointmentDrawer
              initialValues={selectedAppointment}
              modifyMode={modifyMode}
              key={selectedAppointment.id}
              onClose={() => setDrawerOpen(false)}
              open={drawerOpen}
              data-testid="outpatientappointmentdrawer-cuzj"
            />
          </CalendarInnerWrapper>
        </CalendarWrapper>
      </OutpatientAppointmentsContextProvider>
    </Container>
  );
};
