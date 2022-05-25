import React, { useState } from 'react';
import styled from 'styled-components';
import { ListItem, ListItemText, Divider, List, Collapse } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import { TamanuLogoWhite } from '../TamanuLogo';
import { version } from '../../../package.json';
import { FacilityNameDisplay } from '../FacilityNameDisplay';
import { Colors } from '../../constants';
import { administrationIcon, logoutIcon } from '../../constants/images';
import { Translated } from '../Translated';

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

const SidebarPrimaryIcon = styled.img`
  width: 2.2em;
  height: 2.2em;
  border: none;
`;

const SidebarItemText = styled(ListItemText)`
  color: ${grey[100]};
  padding-left: 15px;
  font-size: 1.05rem;

  &::first-letter {
    text-transform: uppercase;
  }
`;

const PrimarySidebarItem = ({ icon, label, children, selected, onClick }) => (
  <>
    <ListItem button onClick={onClick} selected={selected} data-test-class="primary-sidebar-item">
      <SidebarPrimaryIcon src={icon || administrationIcon} />
      <SidebarItemText disableTypography primary={label} />
    </ListItem>
    <Collapse in={selected} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {children}
      </List>
    </Collapse>
  </>
);

const StyledListItem = styled(ListItem)`
  padding: 2px 0 2px 32px;
`;

const SecondarySidebarItem = ({ path, icon, label, isCurrent, disabled, onClick }) => (
  <StyledListItem
    button
    to={path}
    disabled={disabled}
    selected={isCurrent}
    onClick={onClick}
    data-test-class="secondary-sidebar-item"
  >
    <i className={icon} />
    <SidebarItemText disableTypography primary={label} />
  </StyledListItem>
);

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
        <ListItem button onClick={handleLogout} data-test-id="siderbar-logout-item">
          <SidebarPrimaryIcon src={logoutIcon} />
          <SidebarItemText disableTypography primary={<Translated id="logout" />} />
        </ListItem>
      </div>
      <AdditionalInfo>
        <div>Version {version}</div>
        <FacilityNameDisplay />
      </AdditionalInfo>
    </Container>
  );
};
