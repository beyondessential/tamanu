import React, { useState } from 'react';
import styled from 'styled-components';
import { IconButton } from '@material-ui/core';
import { WS_EVENTS } from '@tamanu/constants';

import { Heading1, Heading5, PageContainer } from '../../components';
import { RecentlyViewedPatientsList } from '../../components/RecentlyViewedPatientsList';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useAuth } from '../../contexts/Auth';
import { Colors } from '../../constants';
import { NotificationIcon } from '../../assets/icons/NotificationIcon';
import { NotificationDrawer } from '../../components/Notification/NotificationDrawer';
import { useAutoUpdatingQuery } from '../../api/queries/useAutoUpdatingQuery';
import { TodayBookingsPane } from './components/TodayBookingsPane';
import { TodayAppointmentsPane } from './components/TodayAppointmentsPane';
import { useAppointmentsQuery } from '../../api/queries';
import { DashboardTaskPane } from '../../components/Tasks/DashboardTaskPane';

const TopBar = styled.div`
  position: sticky;
  height: 90px;
  top: 0;
  padding: 20px 28px 20px 18px;
  background-color: ${Colors.white};
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 1;
`;

const NotificationIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 16px;
  background-color: ${Colors.alert};
  width: 12px;
  height: 12px;
  border-radius: 50%;
`;

const DashboardLayout = styled.div`
  display: flex;
  margin: 20px;
  justify-content: space-between;
  gap: 20px;
  .MuiListItem-root {
    margin: 0 -20px 0 -20px;
  }
  height: calc(100vh - 130px);
`;

const PatientsTasksContainer = styled.div`
  flex-grow: 1;
`;

const SchedulePanesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const DashboardView = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { data: notifications = {}, isLoading } = useAutoUpdatingQuery(
    'notifications',
    {},
    `${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`,
  );
  const { currentUser, ability } = useAuth();
  const appointments =
    useAppointmentsQuery({
      locationGroupId: '',
      all: true,
      after: '1970-01-01 00:00',
      clinicianId: currentUser?.id,
    }).data?.data ?? [];
  const bookings =
    useAppointmentsQuery({
      locationId: '',
      all: true,
      after: '1970-01-01 00:00',
      clinicianId: currentUser?.id,
    }).data?.data ?? [];
  const canReadAppointments = ability.can('read', 'Appointment');
  const canListAppointments = ability.can('list', 'Appointment');

  const showBookings = canReadAppointments && canListAppointments && bookings.length > 0;
  const showAppointments = canReadAppointments && canListAppointments && appointments.length > 0;

  return (
    <PageContainer>
      <TopBar>
        <div>
          <Heading1 margin={0}>
            <TranslatedText
              stringId="view.dashboard.title"
              fallback="Hi :username!  👋"
              replacements={{ username: currentUser?.displayName }}
            />
          </Heading1>
          <Heading5 margin={0}>
            <TranslatedText
              stringId="view.dashboard.subtitle"
              fallback="Take a moment to review new notifications and upcoming tasks during your shift."
            />
          </Heading5>
        </div>
        <IconButton onClick={() => setNotificationOpen(true)}>
          <NotificationIcon />
          {!!notifications.unreadNotifications?.length && <NotificationIndicator />}
        </IconButton>
      </TopBar>
      <NotificationDrawer
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
        isLoading={isLoading}
      />
      <DashboardLayout showBookings={showBookings} showAppointments={showAppointments}>
        <PatientsTasksContainer>
          <RecentlyViewedPatientsList isDashboard patientPerPage={showBookings ? 4 : 6} />
          <DashboardTaskPane />
        </PatientsTasksContainer>
        <SchedulePanesContainer>
          {showAppointments && <TodayAppointmentsPane />}
          {showBookings && <TodayBookingsPane />}
        </SchedulePanesContainer>
      </DashboardLayout>
    </PageContainer>
  );
};
