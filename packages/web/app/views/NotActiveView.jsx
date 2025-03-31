import React from 'react';
import { Notification, TopBar } from '../components';

export const NotActiveView = React.memo(() => (
  <>
    <TopBar title="Not active yet" data-testid='topbar-3loi' />
    <Notification
      message="This section is not activated yet."
      data-testid='notification-db7o' />
  </>
));
