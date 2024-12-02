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
import { useLocationBookingsQuery, useOutpatientAppointmentsQuery } from '../../api/queries';
import { DashboardTaskPane } from '../../components/Tasks/DashboardTaskPane';
import { useSettings } from '../../contexts/Settings';

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
  ${({ showTasks }) => showTasks && 'justify-content: space-between;'}
  gap: 20px;
  .MuiListItem-root {
    margin: 0 -20px 0 -20px;
  }
  height: calc(100vh - 83px);
  ${({ showTasks }) => !showTasks && 'flex-direction: column;'}
`;

const PatientsTasksContainer = styled.div`
  ${({ showTasks }) => showTasks && 'flex-grow: 1;'}
  display: flex;
  flex-direction: column;
`;

const SchedulePanesContainer = styled.div`
  display: flex;
  flex-direction: ${({ showTasks }) => (showTasks ? 'column' : 'row')};
  gap: 20px;
  ${({ showTasks }) => !showTasks && 'flex-grow: 1;'}
`;

export const DashboardView = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { data: notifications = {}, isLoading } = useAutoUpdatingQuery(
    'notifications',
    {},
    `${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`,
  );
  const { getSetting } = useSettings();
  const { currentUser, ability } = useAuth();
  const appointments =
    useOutpatientAppointmentsQuery({
      all: true,
      after: '1970-01-01 00:00',
      clinicianId: currentUser?.id,
    }).data?.data ?? [];
  const bookings =
    useLocationBookingsQuery({
      all: true,
      after: '1970-01-01 00:00',
      clinicianId: currentUser?.id,
    }).data?.data ?? [];
  const canReadAppointments = ability.can('read', 'Appointment');
  const canListAppointments = ability.can('list', 'Appointment');
  const canReadTasks = ability.can('read', 'Task');

  const showTasks = canReadTasks && getSetting('features.enableTasking');
  const showBookings = canReadAppointments && canListAppointments && bookings.length > 0;
  const showAppointments = canReadAppointments && canListAppointments && appointments.length > 0;

  const patientPerPage = showTasks && (showAppointments || showBookings) ? 4 : 6;

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
      <DashboardLayout showTasks={showTasks}>
        <PatientsTasksContainer showTasks={showTasks}>
          <RecentlyViewedPatientsList isDashboard patientPerPage={patientPerPage} />
          {showTasks && <DashboardTaskPane />}
        </PatientsTasksContainer>
        <SchedulePanesContainer showTasks={showTasks}>
          {showAppointments && <TodayAppointmentsPane showTasks={showTasks} />}
          {showBookings && <TodayBookingsPane showTasks={showTasks} />}
        </SchedulePanesContainer>
      </DashboardLayout>
    </PageContainer>
  );
};
