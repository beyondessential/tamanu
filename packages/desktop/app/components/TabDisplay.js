import React from 'react';
import styled from 'styled-components';

import { Tabs, Tab } from '@material-ui/core';

const TabContainer = styled(Tabs)`
  background: #fff;

  .MuiTabs-indicator {
    background-color: #326699;
  }
`;

const StyledTab = styled(Tab)`
  span {
    flex-direction: row;
    text-transform: capitalize;
  }

  && i:first-child {
    margin-bottom: 0;
    font-size: 22px;
  }
`;

const Icon = styled.i`
  color: ${props => props.color};
  margin-right: 5px;
`;

export const TabDisplay = React.memo(({ tabs, currentTab, onTabSelect, ...tabProps }) => {
  const currentTabData = tabs.find(t => t.key === currentTab);
  const buttons = tabs.map(({ key, label, render, icon }) => (
    <StyledTab
      key={key}
      icon={<Icon className={icon} color={currentTabData.key === key ? '#326699' : '#b8b8b8'} />}
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
