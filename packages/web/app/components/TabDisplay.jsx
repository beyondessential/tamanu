import { Tab, Tabs } from '@material-ui/core';
import { svgIconClasses, tabsClasses } from '@mui/material';

import React from 'react';
import styled from 'styled-components';
import { isNil } from 'lodash';

import { Colors } from '../constants';

const TabBar = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const TabContainer = styled(Tabs)`
  background: ${Colors.white};

  .MuiTabs-indicator {
    background-color: ${Colors.primary};
  }
`;

const StyledTab = styled(Tab)`
  ${tabsClasses.wrapper} {
    flex-direction: row;
    text-transform: capitalize;
    gap: 5px;
  }

  /* Reset MUI style */
  && :is(.fa, .lucide, .${svgIconClasses.root}) {
    margin-bottom: unset;
  }
  :is([aria-selected='true'], .Mui-selected) :is(.fa, .lucide, .${svgIconClasses.root}) {
    color: ${Colors.primary};
  }
  & .fa {
    font-size: 22px;
  }
  & :is(.lucide, .${svgIconClasses.root}) {
    font-size: 24px;
  }
`;

export const TabDisplay = React.memo(
  ({ tabs, currentTab, onTabSelect, className, scrollable = true, ...tabProps }) => {
    const currentTabData = tabs.find(t => t.key === currentTab);
    if (!currentTabData) {
      return null;
    }

    const buttons = tabs.map(({ key, label, render, icon }) => {
      const tabIcon =
        icon &&
        (typeof icon === 'string' ? (
          <i className={icon} data-testid={`icon-r0ru-${key}`} />
        ) : (
          React.cloneElement(icon)
        ));

      return (
        <StyledTab
          key={key}
          icon={tabIcon}
          data-testid={`tab-${key}`}
          style={{ minWidth: 'auto' }}
          label={label}
          disabled={!render}
          value={key}
          onClick={() => onTabSelect(key)}
        />
      );
    });
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
        {currentTabData.render(tabProps)}
      </TabBar>
    );
  },
);
