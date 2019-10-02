import React from 'react';
import styled from 'styled-components';

import { Tabs, Tab } from '@material-ui/core';
import { Colors } from '../constants';

const TabContainer = styled(Tabs)`
  background: ${Colors.white};

  .MuiTabs-indicator {
    background-color: ${Colors.primary};
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
      icon={
        <Icon
          className={icon}
          color={currentTabData.key === key ? Colors.primary : Colors.softText}
        />
      }
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
