import React from 'react';
import styled from 'styled-components';
import { IconButton } from '@material-ui/core';

import { Heading1, Heading5, PageContainer } from '../../components';
import { RecentlyViewedPatientsList } from '../../components/RecentlyViewedPatientsList';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useAuth } from '../../contexts/Auth';
import { Colors } from '../../constants';
import { NotificationIcon } from '../../assets/icons/NotificationIcon';
import { TodayBookingsPane } from './components/TodayBookingsPane';
import { useAppointmentsQuery } from '../../api/queries';

const TopBar = styled.div`
  position: sticky;
  height: 90px;
  top: 0;
  padding: 20px 28px 20px 18px;
  background-color: ${Colors.white};
  display: flex;
  justify-content: space-between;
`;

const DashboardLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(${p => p.showBookings ? 3 : 2}, 1fr);
  grid-template-rows: repeat(2, auto);
  justify-content: space-between;
  margin: 20px;
  grid-column-gap: 2%;
  .MuiListItem-root {
    margin: 0 -20px 0 -20px;
  }
`;

export const DashboardView = () => {
  const { currentUser, ability } = useAuth();
  const appointments = useAppointmentsQuery({
    locationId: '',
    all: true,
    after: '1970-01-01 00:00',
    clinicianId: currentUser?.id,
  }).data?.data ?? [];
  const canReadAppointments = ability.can('read', 'Appointment');
  const canListAppointments = ability.can('list', 'Appointment');

  const showBookings = canReadAppointments && canListAppointments && appointments.length > 0;

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
        <IconButton>
          <NotificationIcon />
        </IconButton>
      </TopBar>
      <DashboardLayout showBookings={showBookings}>
        <RecentlyViewedPatientsList inDashboard patientPerPage={showBookings ? 4 : 6} />
        {showBookings && <TodayBookingsPane />}
      </DashboardLayout>
    </PageContainer>
  );
};
