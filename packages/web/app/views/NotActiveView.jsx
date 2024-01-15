import React from 'react';
import { Notification, TopBar } from '../components';

export const NotActiveView = React.memo(() => (
  <>
    <TopBar title="Not active yet" />
    <Notification message="This section is not activated yet." />
  </>
));
