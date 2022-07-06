import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Tabs as MuiTabs, Tab as MuiTab } from '@material-ui/core';
import { Colors } from '../constants';

const TabBar = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TabContainer = styled(MuiTabs)`
  background: ${Colors.white};

  .MuiTabs-indicator {
    background-color: ${Colors.primary};
    height: 3px;
  }
`;

const StyledTab = styled(MuiTab)`
  span {
    flex-direction: row;
    align-items: center;
    text-transform: capitalize;
  }

  &.MuiTab-labelIcon .MuiTab-wrapper i {
    margin-bottom: 0;
    font-size: 22px;
    color: ${Colors.softText};
  }

  &.Mui-selected .MuiTab-wrapper i {
    color: ${Colors.primary};
  }
`;

const Icon = styled.i`
  color: ${props => props.color};
  margin-right: 5px;
`;

export const Tab = ({ value, label, icon, selected, onClick }) => (
  <StyledTab
    key={value}
    onClick={onClick}
    selected={selected}
    icon={<Icon className={icon} />}
    style={{ minWidth: 'auto' }}
    label={label}
    value={value}
  />
);

Tab.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  selected: PropTypes.bool,
};

Tab.defaultProps = {
  icon: '',
  selected: false,
};

export const Tabs = ({ value, onChange, tabs, children, className }) => {
  return (
    <TabBar className={className}>
      <TabContainer variant="scrollable" scrollButtons="on" value={value}>
        {tabs.map(tabConfig => (
          <Tab
            key={`tab-${tabConfig.value}`}
            value={tabConfig.value}
            label={tabConfig.label}
            icon={tabConfig.icon}
            selected={tabConfig.value === value}
            onClick={() => onChange(tabConfig.value)}
          />
        ))}
      </TabContainer>
      {children}
    </TabBar>
  );
};

Tabs.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  tabs: PropTypes.arrayOf(PropTypes.shape(Tab.propTypes)),
  className: PropTypes.string,
};

Tabs.defaultProps = {
  tabs: [],
  className: '',
};
