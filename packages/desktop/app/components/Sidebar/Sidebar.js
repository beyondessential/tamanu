import React, { useState } from 'react';
import styled from 'styled-components';
import {
  ListItem,
  ListItemText,
  List,
  Collapse,
  Divider,
  Box,
  Typography,
  Avatar,
  Button,
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { TamanuLogoWhite } from '../TamanuLogo';
import { Colors } from '../../constants';
import { administrationIcon } from '../../constants/images';
import { version } from '../../../package.json';
import { Translated } from '../Translated';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background: ${Colors.primaryDark};
  min-width: 260px;
  padding: 0 15px;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.15);
  color: ${Colors.white};

  i {
    color: ${Colors.white};
  }
`;

const Logo = styled(TamanuLogoWhite)`
  margin: 24px 0 14px 18px;
`;

const PrimaryListItem = styled(ListItem)`
  border-radius: 4px;
  padding-right: 10px;

  .MuiSvgIcon-root {
    position: relative;
    top: -1px;
    opacity: 0.9;
    font-size: 22px;
    transform: rotate(0deg);
    transition: transform 0.2s ease;
  }

  &.Mui-selected {
    background: none;

    .MuiSvgIcon-root {
      transform: rotate(180deg);
    }
  }

  &:hover,
  &.Mui-selected:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SidebarPrimaryIcon = styled.img`
  width: 22px;
  height: 22px;
  border: none;
`;

const PrimaryItemText = styled(ListItemText)`
  padding-left: 10px;
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  letter-spacing: 0;
`;

const PrimarySidebarItem = ({ icon, label, children, selected, onClick }) => (
  <>
    <PrimaryListItem
      button
      onClick={onClick}
      selected={selected}
      data-test-class="primary-sidebar-item"
    >
      <SidebarPrimaryIcon src={icon || administrationIcon} />
      <PrimaryItemText disableTypography primary={label} />
      <ExpandMore />
    </PrimaryListItem>
    <Collapse in={selected} timeout="auto" unmountOnExit>
      <List component="div" style={{ padding: '0 0 4px 0' }}>
        {children}
      </List>
    </Collapse>
  </>
);

const SecondaryListItem = styled(ListItem)`
  padding: 0 0 2px 48px;
  border-radius: 4px;

  &:hover,
  &.Mui-selected,
  &.Mui-selected:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SecondaryItemText = styled(ListItemText)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 400;
  letter-spacing: 0;
`;

const Dot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${props => props.$color};
  margin-right: 14px;
`;

const SecondarySidebarItem = ({ path, label, isCurrent, disabled, onClick, color }) => (
  <SecondaryListItem
    button
    to={path}
    disabled={disabled}
    selected={isCurrent}
    onClick={onClick}
    data-test-class="secondary-sidebar-item"
  >
    {color && <Dot $color={color} />}
    <SecondaryItemText disableTypography primary={label} />
  </SecondaryListItem>
);

const Footer = styled.div`
  margin-top: auto;
  padding-bottom: 20px;
  padding-right: 18px;
`;

const StyledDivider = styled(Divider)`
  background-color: rgba(255, 255, 255, 0.2);
  margin-bottom: 14px;
  margin-left: 16px;
`;

const UserName = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 5px;
  line-height: 18px;
`;

const Facility = styled(Typography)`
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
`;

const StyledAvatar = styled(Avatar)`
  background: #e7b091;
  font-weight: 500;
  font-size: 16px;
  margin-right: 12px;
  margin-top: 5px;
  text-transform: uppercase;
`;

const Version = styled.div`
  color: ${Colors.softText};
  font-size: 9px;
  line-height: 15px;
  font-weight: 400;
  margin-top: 6px;
`;

const LogoutButton = styled(Button)`
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  color: white;
  text-transform: none;
  text-decoration: underline;
`;

const getInitials = string =>
  string
    .match(/\b(\w)/g)
    .slice(0, 2)
    .join('');

export const Sidebar = ({
  currentPath,
  items,
  onPathChanged,
  onLogout,
  permissionCheck = () => true,
  currentUser,
  facilityName,
}) => {
  const initials = getInitials(currentUser.displayName);
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
      <Logo size="126px" />
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
                color={child.color}
                label={child.label}
                disabled={!permissionCheck(child, item)}
                onClick={() => onPathChanged(child.path)}
              />
            ))}
          </PrimarySidebarItem>
        ))}
      </List>
      <Footer>
        <StyledDivider />
        <Box display="flex" color="white">
          <StyledAvatar>{initials}</StyledAvatar>
          <Box flex={1}>
            <UserName>{currentUser?.displayName}</UserName>
            {facilityName && <Facility>{facilityName}</Facility>}
            <Box display="flex" justifyContent="space-between">
              <Version>Version {version}</Version>
              <LogoutButton
                type="button"
                onClick={handleLogout}
                id="logout"
                data-test-id="siderbar-logout-item"
              >
                <Translated id="logout" />
              </LogoutButton>
            </Box>
          </Box>
        </Box>
      </Footer>
    </Container>
  );
};
