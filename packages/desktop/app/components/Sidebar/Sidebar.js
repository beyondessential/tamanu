import React, { Component } from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import MuiList from '@material-ui/core/List';

import { TamanuLogoWhite } from '../TamanuLogo';
import { version } from '../../../package.json';
import { LogoutItem } from './LogoutItem';
import { SecondarySidebarItem } from './SecondarySidebarItem';
import { PrimarySidebarItem } from './PrimarySidebarItem';
import { Colors } from '../../constants';

const Container = styled.div`
  background: ${Colors.primaryDark};
  min-width: 260px;
  padding-left: 8px;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.15);
  color: ${Colors.white};

  i {
    color: ${Colors.white};
  }
`;

const Logo = styled(TamanuLogoWhite)`
  margin: 24px 0 10px 20px;
`;

const VersionContainer = styled.div`
  color: ${Colors.softText};
  position: absolute;
  bottom: 8px;
  left: 16px;
`;

export class Sidebar extends Component {
  constructor() {
    super();
    this.state = {
      selectedParentItem: '',
    };
  }

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
      <Container>
        <Logo size="140px" />
        <MuiList component="nav">
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
        </MuiList>
        <div>
          <Divider />
          <LogoutItem onClick={this.onLogout} />
        </div>
        <VersionContainer>
          Version
          {version}
        </VersionContainer>
      </Container>
    );
  }
}
