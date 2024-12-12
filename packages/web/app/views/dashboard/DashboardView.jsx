import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, IconButton } from '@material-ui/core';
import { WS_EVENTS } from '@tamanu/constants';
import { useQuery } from '@tanstack/react-query';

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
import { useApi } from '../../api';
import welcomingSrc from '../../assets/images/welcoming.svg';

const TopBarContainer = styled.div`
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
  height: calc(100vh - 131px);
  ${({ showTasks }) => !showTasks && 'flex-direction: column;'}
`;

const PatientsTasksContainer = styled.div`
  ${({ showTasks }) => showTasks && 'flex-grow: 1; width: 69%;'}
  display: flex;
  flex-direction: column;
  gap: 20px;
  .MuiListItem-root {
    margin: 0 -20px 0 -20px;
  }
`;

const SchedulePanesContainer = styled.div`
  display: flex;
  flex-direction: ${({ showTasks }) => (showTasks ? 'column' : 'row')};
  gap: 20px;
  ${({ showTasks }) => (!showTasks ? 'flex-grow: 1;' : 'width: 31%;')}
`;

const WelcomeSection = styled.div`
  display: flex;
  background-color: ${Colors.white};
  padding: 0 50px;
  justify-content: space-between;
  flex-direction: column;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  flex-grow: 1;
`;

const WelcomeImage = styled.img`
  width: 100%;
  height: fit-content;
  margin-left: auto;
  margin-right: auto;
`;

const WelcomeMessage = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  width: 80%;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 20px;
`;

const WelcomeText = styled(Box)`
  text-align: center;
`;

const WelcomePageContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

const WelcomePaneContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px;
  flex-grow: 1;
  .MuiListItem-root {
    margin: 0 -20px 0 -20px;
  }
`;

const TopBar = ({ subtitle }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { data: notifications = {}, isLoading } = useAutoUpdatingQuery(
    'notifications',
    {},
    `${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`,
  );
  const { currentUser } = useAuth();

  return (
    <TopBarContainer>
      <div>
        <Heading1 margin={0}>
          <TranslatedText
            stringId="view.dashboard.topbar.title"
            fallback="Hi :username!  👋"
            replacements={{ username: currentUser?.displayName }}
          />
        </Heading1>
        <Heading5 margin={0}>{subtitle}</Heading5>
      </div>
      <IconButton onClick={() => setNotificationOpen(true)}>
        <NotificationIcon />
        {!!notifications.unreadNotifications?.length && <NotificationIndicator />}
      </IconButton>
      <NotificationDrawer
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
        isLoading={isLoading}
      />
    </TopBarContainer>
  );
};

const WelcomePane = ({ patientPerPage }) => {
  const api = useApi();
  const { data: { data: recentlyViewedPatients = [] } = {} } = useQuery(
    ['recentlyViewedPatients'],
    () => api.get('user/recently-viewed-patients'),
  );

  let subtitle = (
    <TranslatedText stringId="view.dashboard.welcome.title" fallback="Welcome to Tamanu!" />
  );
  if (recentlyViewedPatients.length) {
    subtitle = (
      <TranslatedText
        stringId="view.dashboard.welcome.subtitle.noPermissions"
        fallback="Take a moment to review new notifications."
      />
    );
  }

  return (
    <WelcomePageContainer>
      <TopBar subtitle={subtitle} />
      <WelcomePaneContainer>
        <RecentlyViewedPatientsList isDashboard patientPerPage={patientPerPage} />
        <WelcomeSection>
          <WelcomeMessage>
            <Heading1>
              <TranslatedText
                stringId="view.dashboard.welcome.title"
                fallback="Welcome to Tamanu!"
              />
            </Heading1>
            <WelcomeText>
              <TranslatedText
                stringId="view.dashboard.welcome.subtitle"
                fallback="Take a moment to have a look around using the left hand menu."
              />
            </WelcomeText>
            <WelcomeText mt={4} color={Colors.darkText}>
              <TranslatedText
                stringId="view.dashboard.welcome.description"
                fallback="This is the Tamanu Dashboard - at the moment, you do not have permission to see bookings, appointments, or tasking so there is nothing to see here. Please speak to your System Administrator if you think this is incorrect."
              />
            </WelcomeText>
          </WelcomeMessage>
          <WelcomeImage src={welcomingSrc} />
        </WelcomeSection>
      </WelcomePaneContainer>
    </WelcomePageContainer>
  );
};

export const DashboardView = () => {
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
  const canReadTasks = ability.can('read', 'Tasking');

  const showTasks = canReadTasks && getSetting('features.enableTasking');
  const showBookings = canReadAppointments && canListAppointments && bookings.length > 0;
  const showAppointments = canReadAppointments && canListAppointments && appointments.length > 0;

  const patientPerPage = showTasks && (showAppointments || showBookings) ? 4 : 6;

  const showWelcomeMessage = !showTasks && !showAppointments && !showBookings;

  if (showWelcomeMessage) {
    return <WelcomePane patientPerPage={patientPerPage} />;
  }

  let subtitle = (
    <TranslatedText
      stringId="view.dashboard.topbar.subtitle.full"
      fallback="Take a moment to review new notifications, upcoming tasks and scheduling during your shift."
    />
  );
  if (!showTasks) {
    subtitle = (
      <TranslatedText
        stringId="view.dashboard.topbar.subtitle.noTasks"
        fallback="Take a moment to review new notifications and upcoming scheduling during your shift."
      />
    );
  } else if (!showAppointments && !showBookings) {
    subtitle = (
      <TranslatedText
        stringId="view.dashboard.topbar.subtitle.noAppointments"
        fallback="Take a moment to review new notifications and upcoming tasks during your shift."
      />
    );
  }

  return (
    <PageContainer>
      <TopBar subtitle={subtitle} />
      <DashboardLayout showTasks={showTasks}>
        <PatientsTasksContainer showTasks={showTasks}>
          <RecentlyViewedPatientsList isDashboard patientPerPage={patientPerPage} />
          {showTasks && <DashboardTaskPane />}
        </PatientsTasksContainer>
        {(showAppointments || showBookings) && (
          <SchedulePanesContainer showTasks={showTasks}>
            {showAppointments && <TodayAppointmentsPane showTasks={showTasks} />}
            {showBookings && <TodayBookingsPane showTasks={showTasks} />}
          </SchedulePanesContainer>
        )}
      </DashboardLayout>
    </PageContainer>
  );
};
