import React, { Component } from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';

import { TamanuLogo } from '../TamanuLogo';
import { LogoutItem } from './LogoutItem';
import { SecondarySidebarItem } from './SecondarySidebarItem';
import { PrimarySidebarItem } from './PrimarySidebarItem';
import { Colors } from '../../constants';

const SidebarContainer = styled.div`
  @media print {
    display: none;
  }

  min-width: 275px;
  height: 100vh;
  position: relative;
  background: ${Colors.primaryDark};
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
`;

const LogoContainer = styled.div`
  width: 100%;
  text-align: center;
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
            {items.map(item => {
              return (
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
              );
            })}
          </List>
          <Divider />
          <List>
            <LogoutItem onClick={this.onLogout} />
          </List>
        </SidebarMenuContainer>
        <LogoContainer>
          <div onClick={() => onPathChanged('/')}>
            <TamanuLogo size="120px" />
          </div>
        </LogoContainer>
      </SidebarContainer>
    );
  }
}
