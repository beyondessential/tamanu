import React from 'react';
import styled from 'styled-components';

import { Tab, Tabs } from '@material-ui/core';
import { Colors } from '../constants';

const TabBar = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

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
  color: ${(props) => props.color};
  margin-right: 5px;
`;

export const TabDisplay = React.memo(
  ({ tabs, currentTab, onTabSelect, className, scrollable = true, ...tabProps }) => {
    const currentTabData = tabs.find((t) => t.key === currentTab);
    if (!currentTabData) {
      return null;
    }

    const buttons = tabs.map(({ key, label, render, icon }) => (
      <StyledTab
        key={key}
        icon={
          <Icon
            className={icon}
            color={currentTabData.key === key ? Colors.primary : Colors.softText}
            data-testid={`icon-r0ru-${key}`}
          />
        }
        style={{ minWidth: 'auto' }}
        label={label}
        disabled={!render}
        value={key}
        onClick={() => onTabSelect(key)}
        data-testid={`styledtab-yhha-${key}`}
      />
    ));
    return (
      <TabBar className={className} data-testid="tabbar-bg0b">
        <TabContainer
          variant={scrollable ? 'scrollable' : 'fixed'}
          scrollButtons={scrollable ? 'on' : 'off'}
          value={currentTab}
          data-testid="tabcontainer-4j73"
        >
          {buttons}
        </TabContainer>
        {currentTabData.render({ ...tabProps })}
      </TabBar>
    );
  },
);
