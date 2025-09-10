import React from 'react';
import styled from 'styled-components';

import { Tab, Tabs } from '@material-ui/core';
import { TAMANU_COLORS } from '@tamanu/ui-components';

const TabBar = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TabContainer = styled(Tabs)`
  background: ${TAMANU_COLORS.white};

  .MuiTabs-indicator {
    background-color: ${TAMANU_COLORS.primary};
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
            color={currentTabData.key === key ? TAMANU_COLORS.primary : TAMANU_COLORS.softText}
            data-testid={`icon-r0ru-${key}`}
          />
        }
        data-testid={`tab-${key}`}
        style={{ minWidth: 'auto' }}
        label={label}
        disabled={!render}
        value={key}
        onClick={() => onTabSelect(key)}
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
