import React, { useState } from 'react';
import styled from 'styled-components';
import { Divider, List } from '@material-ui/core';
import { TamanuLogoWhite } from '../TamanuLogo';
import { version } from '../../../package.json';
import { LogoutItem } from './LogoutItem';
import { SecondarySidebarItem } from './SecondarySidebarItem';
import { PrimarySidebarItem } from './PrimarySidebarItem';
import { FacilityNameDisplay } from '../FacilityNameDisplay';
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

const AdditionalInfo = styled.div`
  flex-grow: 0;
  display: flex;
  flex-direction: column;
  color: ${Colors.softText};
  margin: 0.7rem;
  font-size: 0.8rem;
`;

const Logo = styled(TamanuLogoWhite)`
  margin: 24px 0 10px 20px;
`;

export const Sidebar = ({
  currentPath,
  items,
  onPathChanged,
  onLogout,
  permissionCheck = () => true,
}) => {
  const [selectedParentItem, setSelectedParentItem] = useState('');

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const clickedParentItem = ({ key }) => {
    if (selectedParentItem === key) {
      setSelectedParentItem('');
    } else {
      setSelectedParentItem(key);
    }
  };

  return (
    <Container>
      <Logo size="140px" />
      <List component="nav">
        {items.map(item => (
          <PrimarySidebarItem
            icon={item.icon}
            label={item.label}
            key={item.key}
            selected={selectedParentItem === item.key}
            onClick={() => clickedParentItem(item)}
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
        <LogoutItem onClick={handleLogout} />
      </div>
      <AdditionalInfo>
        <div>Version {version}</div>
        <FacilityNameDisplay />
      </AdditionalInfo>
    </Container>
  );
};
