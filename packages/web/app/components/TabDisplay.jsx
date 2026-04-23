import React from 'react';
import styled from 'styled-components';
import { isNil } from 'lodash';

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

/**
 * `icon`: Font Awesome class string, React element, or no icon via `null` / `undefined` (`isNil`)
 */
export function resolveTabBarIcon({ icon, selected, testId }) {
  const iconColor = selected ? Colors.primary : Colors.softText;

  // In case we don't want any icons
  if (isNil(icon)) {
    return null;
  }

  if (typeof icon === 'string') {
    return (
      <Icon className={icon} color={iconColor} data-testid={testId} />
    );
  }

  return React.cloneElement(icon, {
    'data-testid': testId,
    style: {
      marginRight: 5,
      ...(icon.props.style || {}),
      color: iconColor,
    },
  });
}

export const TabDisplay = React.memo(
  ({ tabs, currentTab, onTabSelect, className, scrollable = true, ...tabProps }) => {
    const currentTabData = tabs.find((t) => t.key === currentTab);
    if (!currentTabData) {
      return null;
    }

    const buttons = tabs.map(({ key, label, render, icon }) => (
      <StyledTab
        key={key}
        icon={resolveTabBarIcon({
          icon,
          selected: currentTabData.key === key,
          testId: `icon-r0ru-${key}`,
        })}
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
        {currentTabData.render(tabProps)}
      </TabBar>
    );
  },
);
