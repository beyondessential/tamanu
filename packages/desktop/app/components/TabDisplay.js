import React from 'react';
import styled from 'styled-components';

import { Tabs, Tab } from '@material-ui/core';

const TabContainer = styled(Tabs)`
  background: #fff;
`;

export const TabDisplay = React.memo(({ tabs, currentTab, onTabSelect, ...tabProps }) => {
  const currentTabData = tabs.find(t => t.key === currentTab);
  const buttons = tabs.map(({ key, label, render }) => (
    <Tab
      key={key}
      style={{ minWidth: 'auto' }}
      label={label}
      disabled={!render}
      value={key}
      onClick={() => onTabSelect(key)}
    />
  ));
  return (
    <div>
      <TabContainer value={currentTab}>{buttons}</TabContainer>
      <div>{currentTabData.render({ ...tabProps })}</div>
    </div>
  );
});
