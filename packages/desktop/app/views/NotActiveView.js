import React from 'react';
import { TopBar, Notification } from '../components';

export const NotActiveView = React.memo(() => (
  <>
    <TopBar title="Not active yet" />
    <Notification message="This section is not activated yet." />
  </>
));
