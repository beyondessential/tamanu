import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, IconButton } from '@material-ui/core';
import { WS_EVENTS } from '@tamanu/constants';
import { useQuery } from '@tanstack/react-query';

import { TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { Heading1, Heading5, PageContainer } from '../../components';
import { RecentlyViewedPatientsList } from '../../components/RecentlyViewedPatientsList';
import { useAuth } from '../../contexts/Auth';
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
  const { currentUser, facilityId } = useAuth();
  const { data: notifications = {}, isLoading } = useAutoUpdatingQuery(
    'notifications',
    { facilityId },
    `${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`,
  );

  return (
    <TopBarContainer data-testid="topbarcontainer-v4hx">
      <div>
        <Heading1 margin={0} data-testid="heading1-2w7n">
          <TranslatedText
            stringId="view.dashboard.topbar.title"
            fallback="Hi :username!  👋"
            replacements={{ username: currentUser?.displayName }}
            data-testid="translatedtext-o43s"
          />
        </Heading1>
        <Heading5 margin={0} data-testid="heading5-iho5">
          {subtitle}
        </Heading5>
      </div>
      <IconButton onClick={() => setNotificationOpen(true)} data-testid="iconbutton-1sk8">
        <NotificationIcon data-testid="notificationicon-h7mw" />
        {!!notifications.unreadNotifications?.length && (
          <NotificationIndicator data-testid="notificationindicator-yrhl" />
        )}
      </IconButton>
      <NotificationDrawer
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
        isLoading={isLoading}
        data-testid="notificationdrawer-kdja"
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
    <TranslatedText
      stringId="view.dashboard.welcome.title"
      fallback="Welcome to Tamanu!"
      data-testid="translatedtext-dw8d"
    />
  );
  if (recentlyViewedPatients.length) {
    subtitle = (
      <TranslatedText
        stringId="view.dashboard.welcome.subtitle.noPermissions"
        fallback="Take a moment to review new notifications."
        data-testid="translatedtext-0vha"
      />
    );
  }

  return (
    <WelcomePageContainer data-testid="welcomepagecontainer-gsx9">
      <TopBar subtitle={subtitle} data-testid="topbar-e90j" />
      <WelcomePaneContainer data-testid="welcomepanecontainer-2y20">
        <RecentlyViewedPatientsList
          isDashboard
          patientPerPage={patientPerPage}
          data-testid="recentlyviewedpatientslist-54q4"
        />
        <WelcomeSection data-testid="welcomesection-0pog">
          <WelcomeMessage data-testid="welcomemessage-g6r8">
            <Heading1 data-testid="heading1-jdty">
              <TranslatedText
                stringId="view.dashboard.welcome.title"
                fallback="Welcome to Tamanu!"
                data-testid="translatedtext-hhz4"
              />
            </Heading1>
            <WelcomeText data-testid="welcometext-qzhq">
              <TranslatedText
                stringId="view.dashboard.welcome.subtitle"
                fallback="Take a moment to have a look around using the left hand menu."
                data-testid="translatedtext-yd6a"
              />
            </WelcomeText>
            <WelcomeText mt={4} color={Colors.darkText} data-testid="welcometext-f8pf">
              <TranslatedText
                stringId="view.dashboard.welcome.description"
                fallback="This is the Tamanu Dashboard. At the moment you do not have permission to view appointments, bookings or tasks, so there is nothing to see here. Please speak to your System Administrator if you think this is incorrect."
                data-testid="translatedtext-7sbq"
              />
            </WelcomeText>
          </WelcomeMessage>
          <WelcomeImage src={welcomingSrc} data-testid="welcomeimage-gw9i" />
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
    return <WelcomePane patientPerPage={patientPerPage} data-testid="welcomepane-ryx6" />;
  }

  let subtitle = (
    <TranslatedText
      stringId="view.dashboard.topbar.subtitle.full"
      fallback="Take a moment to review new notifications, upcoming tasks and scheduling during your shift."
      data-testid="translatedtext-cz4r"
    />
  );
  if (!showTasks) {
    subtitle = (
      <TranslatedText
        stringId="view.dashboard.topbar.subtitle.noTasks"
        fallback="Take a moment to review new notifications and upcoming scheduling during your shift."
        data-testid="translatedtext-85qf"
      />
    );
  } else if (!showAppointments && !showBookings) {
    subtitle = (
      <TranslatedText
        stringId="view.dashboard.topbar.subtitle.noAppointments"
        fallback="Take a moment to review new notifications and upcoming tasks during your shift."
        data-testid="translatedtext-g4fj"
      />
    );
  }

  return (
    <PageContainer data-testid="pagecontainer-d57g">
      <TopBar subtitle={subtitle} data-testid="topbar-fwya" />
      <DashboardLayout showTasks={showTasks} data-testid="dashboardlayout-fufu">
        <PatientsTasksContainer showTasks={showTasks} data-testid="patientstaskscontainer-mqob">
          <RecentlyViewedPatientsList
            isDashboard
            patientPerPage={patientPerPage}
            data-testid="recentlyviewedpatientslist-10ri"
          />
          {showTasks && <DashboardTaskPane data-testid="dashboardtaskpane-42x7" />}
        </PatientsTasksContainer>
        {(showAppointments || showBookings) && (
          <SchedulePanesContainer showTasks={showTasks} data-testid="schedulepanescontainer-tiyj">
            {showAppointments && (
              <TodayAppointmentsPane
                showTasks={showTasks}
                data-testid="todayappointmentspane-qzx2"
              />
            )}
            {showBookings && (
              <TodayBookingsPane showTasks={showTasks} data-testid="todaybookingspane-o3zb" />
            )}
          </SchedulePanesContainer>
        )}
      </DashboardLayout>
    </PageContainer>
  );
};
