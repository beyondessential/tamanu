import React from 'react';

import { Tabs, Tab } from '@material-ui/core';

export const TabDisplay = React.memo(({ tabs, currentTab, onTabSelect, ...tabProps }) => {
  const currentTabData = tabs.find(t => t.key === currentTab);
  const buttons = tabs.map(({ key, label }) => (
    <Tab
      key={key}
      style={{ minWidth: 'auto' }}
      label={label}
      value={key}
      onClick={() => onTabSelect(key)}
    />
  ));
  return (
    <div>
      <Tabs value={currentTab}>{buttons}</Tabs>
      <div>{currentTabData.render({ ...tabProps })}</div>
    </div>
  );
});
