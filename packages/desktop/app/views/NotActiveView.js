import React from 'react';

import { TopBar, Notification } from '../components';

export const NotActiveView = React.memo(() => {
  return (
    <React.Fragment>
      <TopBar title="Not Active Yet" />
      <Notification message="This section is not activated yet." />
    </React.Fragment>
  );
});
