import React, { Component } from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import MuiList from '@material-ui/core/List';

import { version } from '../../../package.json';

import { LogoutItem } from './LogoutItem';
import { SecondarySidebarItem } from './SecondarySidebarItem';
import { PrimarySidebarItem } from './PrimarySidebarItem';
import { FacilityNameDisplay } from '../FacilityNameDisplay';

import { Colors } from '../../constants';

const SidebarContainer = styled.div`
  grid-row: 2 / -1;
  grid-column: 1 / 2;

  min-width: 275px;
  position: relative;
  background: ${Colors.primaryDark};
  box-shadow: 1px 0px 4px rgba(0, 0, 0, 0.15);
  color: ${Colors.white};
  flex-grow: 0;
  flex-shrink: 0;

  display: flex;
  flex-direction: column;

  i {
    color: ${Colors.white};
  }
`;

const SidebarMenuContainer = styled.div`
  flex-grow: 1;
  overflow: auto;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const AdditionalInfo = styled.div`
  flex-grow: 0;
  display: flex;
  flex-direction: column;
  color: ${Colors.softText};
  margin: 0.7rem;
  font-size: 0.8rem;
`;

const List = styled(MuiList)`
  padding-top: 0;
`;

export class Sidebar extends Component {
  state = {
    selectedParentItem: '',
  };

  onLogout = () => {
    const { onLogout } = this.props;
    if (onLogout) {
      onLogout();
    }
  };

  clickedParentItem = ({ key }) => {
    const { selectedParentItem } = this.state;
    if (selectedParentItem === key) {
      this.setState({ selectedParentItem: '' });
    } else {
      this.setState({ selectedParentItem: key });
    }
  };

  render() {
    const { selectedParentItem } = this.state;
    const { currentPath, items, onPathChanged, permissionCheck = () => true } = this.props;
    return (
      <SidebarContainer>
        <SidebarMenuContainer>
          <List component="nav">
            {items.map(item => (
              <PrimarySidebarItem
                icon={item.icon}
                label={item.label}
                key={item.key}
                selected={selectedParentItem === item.key}
                onClick={() => this.clickedParentItem(item)}
              >
                {item.children.map(child => (
                  <SecondarySidebarItem
                    key={child.path}
                    path={child.path}
                    isCurrent={currentPath === child.path}
                    icon={child.icon}
                    label={child.label}
                    disabled={!permissionCheck(child, item)}
                    onClick={() => onPathChanged(child.path)}
                  />
                ))}
              </PrimarySidebarItem>
            ))}
          </List>
          <div>
            <Divider />
            <LogoutItem onClick={this.onLogout} />
          </div>
        </SidebarMenuContainer>
        <AdditionalInfo>
          <div>Version {version}</div>
          <FacilityNameDisplay />
        </AdditionalInfo>
      </SidebarContainer>
    );
  }
}
