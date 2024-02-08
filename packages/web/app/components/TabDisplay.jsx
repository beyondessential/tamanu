import React from 'react';
import styled from 'styled-components';

import { Tab, Tabs } from '@material-ui/core';
import { Colors } from '../constants';
import { useLocalisation } from '../contexts/Localisation';

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
  color: ${props => props.color};
  margin-right: 5px;
`;

const compare = ({ firstTab, secondTab, getLocalisation }) => {
  const firstTabSortPriority = getLocalisation(`tabs.${firstTab.key}.sortPriority`);
  const secondTabSortPriority = getLocalisation(`tabs.${secondTab.key}.sortPriority`);
  return firstTabSortPriority - secondTabSortPriority;
};

export const TabDisplay = React.memo(
  ({ tabs, currentTab, onTabSelect, className, scrollable = true, ...tabProps }) => {
    const { getLocalisation } = useLocalisation();
    const currentTabData = tabs.find(t => t.key === currentTab);
    tabs.sort((firstTab, secondTab) => compare({ firstTab, secondTab, getLocalisation }));
    const buttons = tabs.map(({ key, label, render, icon }) => {
      const hidden = getLocalisation(`tabs.${key}.hidden`);
      
      if (hidden) return null;

      return (
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
      );
    });
    return (
      <TabBar className={className}>
        <TabContainer
          variant={scrollable ? 'scrollable' : 'fixed'}
          scrollButtons={scrollable ? 'on' : 'off'}
          value={currentTab}
        >
          {buttons}
        </TabContainer>
        <div>{currentTabData.render({ ...tabProps })}</div>
      </TabBar>
    );
  },
);
