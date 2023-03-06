import React from 'react';
import styled from 'styled-components';

import { Tabs, Tab } from '@material-ui/core';
import { Colors } from '../constants';

const TabBar = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .MuiTabs-root {
    min-height: 40px;
  }

  .MuiTabs-indicator {
    display: none;
  }
`;

const TabContainer = styled(Tabs)`
  background: ${Colors.white};
  border: 1px solid ${Colors.primary};
  border-radius: 25px;
  width: auto;

  .MuiTab-root {
    min-height: 32px;
    color: ${Colors.primary};
  }

  .Mui-selected {
    margin: 3px;
    border-radius: 25px;
    color: white;
    background-color: ${Colors.primary};
    height: 10px;
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

export const SegmentTabDisplay = React.memo(
  ({ tabs, currentTab, onTabSelect, className, scrollable, ...tabProps }) => {
    const currentTabData = tabs.find(t => t.key === currentTab);
    const buttons = tabs.map(({ key, label, render }) => (
      <StyledTab
        key={key}
        style={{ minWidth: '263px' }}
        label={label}
        disabled={!render}
        value={key}
        onClick={() => onTabSelect(key)}
      />
    ));
    return (
      <TabBar className={className}>
        <TabContainer
          scrollButtons={scrollable ? 'on' : 'off'}
          value={currentTab}
          style={{ height: '10px' }}
        >
          {buttons}
        </TabContainer>
        <div>{currentTabData.render({ ...tabProps })}</div>
      </TabBar>
    );
  },
);
