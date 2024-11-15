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

const TopBar = styled.div`
  position: sticky;
  height: 90px;
  top: 0;
  padding: 20px 28px 20px 18px;
  background-color: ${Colors.white};
  display: flex;
  justify-content: space-between;
  position: relative;
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

export const DashboardView = () => {
  const { currentUser } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { data: notifications = {}, isLoading } = useAutoUpdatingQuery(
    'notifications',
    {},
    `${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`,
  );

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
      <RecentlyViewedPatientsList inDashboard />
      <NotificationDrawer
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
        isLoading={isLoading}
      />
    </PageContainer>
  );
};
