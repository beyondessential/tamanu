import { svgIconClasses } from '@mui/material/SvgIcon';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';

export const TabContainer = styled(Tabs)`
  background: ${Colors.white};
  .MuiTabs-indicator {
    background-color: ${Colors.primary};
  }
`;

const StyledTab = styled(Tab).attrs({ iconPosition: 'start' })`
  &:not([aria-selected='true'], .Mui-selected) .fa {
    color: ${Colors.softText};
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
        (typeof icon === 'string' ? <i className={icon} data-testid={`icon-r0ru-${key}`} /> : icon);

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
      <>
        <TabContainer
          className={className}
          variant={scrollable ? 'scrollable' : undefined}
          scrollButtons={Boolean(scrollable)}
          value={currentTab}
          data-testid="tabcontainer-4j73"
        >
          {buttons}
        </TabContainer>
        {currentTabData.render(tabProps)}
      </>
    );
  },
);
