import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { List, Divider, Box, Typography, Avatar, Button } from '@material-ui/core';
import { TamanuLogoWhite } from '../TamanuLogo';
import { Colors } from '../../constants';
import packagej from '../../../package.json';
import { Translated } from '../Translated';
import { TopLevelSidebarItem } from './TopLevelSidebarItem';
import { PrimarySidebarItem } from './PrimarySidebarItem';
import { SecondarySidebarItem } from './SecondarySidebarItem';
import { getCurrentRoute } from '../../store/router';
import { checkAbility } from '../../utils/ability';
import { useAuth } from '../../contexts/Auth';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background: ${Colors.primaryDark};
  min-width: 260px;
  max-width: 280px;
  padding: 0 15px;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.15);
  color: ${Colors.white};
  overflow: auto;
  height: 100vh;

  i {
    color: ${Colors.white};
  }
`;

const Logo = styled(TamanuLogoWhite)`
  margin: 24px 0 14px 18px;
`;

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
  color: ${Colors.white};
  text-transform: none;
  text-decoration: underline;
`;

const getInitials = string =>
  string
    .match(/\b(\w)/g)
    .slice(0, 2)
    .join('');

const permissionCheck = (...items) => {
  const ability = { ...items.map(item => item.ability) };
  if (!ability.subject || !ability.action) {
    return true;
  }
  return checkAbility(ability);
};

// currentPath - the current route. eg. /programs/covid-19/patients
// menuItemPath - the configured routes that are displayed in the sidebar. eg /patients
const isHighlighted = (currentPath, menuItemPath, sectionIsOpen) => {
  // remove leading slashes to get a like for like comparison
  const sectionPath = currentPath.replace(/^\/|\/$/g, '').split('/')[0];
  const itemPath = menuItemPath.replace(/^\/|\/$/g, '');
  // If the section is open, the child menu item is highlighted and the top level menu item is not
  return sectionPath === itemPath && !sectionIsOpen;
};

export const Sidebar = React.memo(({ items }) => {
  const [selectedParentItem, setSelectedParentItem] = useState('');
  const { facility, currentUser, onLogout } = useAuth();
  const currentPath = useSelector(getCurrentRoute);
  const dispatch = useDispatch();

  const onPathChanged = newPath => dispatch(push(newPath));

  const clickedParentItem = ({ key }) => {
    if (selectedParentItem === key) {
      setSelectedParentItem('');
    } else {
      setSelectedParentItem(key);
    }
  };

  const initials = getInitials(currentUser.displayName);

  return (
    <Container>
      <Logo size="126px" />
      <List component="nav">
        {items.map(item =>
          item.children ? (
            <PrimarySidebarItem
              icon={item.icon}
              label={item.label}
              divider={item.divider}
              key={item.key}
              highlighted={isHighlighted(currentPath, item.path, selectedParentItem === item.key)}
              selected={selectedParentItem === item.key}
              onClick={() => clickedParentItem(item)}
            >
              {item.children.map(child => (
                <SecondarySidebarItem
                  key={child.path}
                  path={child.path}
                  isCurrent={currentPath.includes(child.path)}
                  color={child.color}
                  label={child.label}
                  disabled={!permissionCheck(child, item)}
                  onClick={() => onPathChanged(child.path)}
                />
              ))}
            </PrimarySidebarItem>
          ) : (
            <TopLevelSidebarItem
              icon={item.icon}
              path={item.path}
              label={item.label}
              divider={item.divider}
              key={item.key}
              isCurrent={currentPath.includes(item.path)}
              disabled={!permissionCheck(item)}
              onClick={() => onPathChanged(item.path)}
            />
          ),
        )}
      </List>
      <Footer>
        <StyledDivider />
        <Box display="flex" color="white">
          <StyledAvatar>{initials}</StyledAvatar>
          <Box flex={1}>
            <UserName>{currentUser?.displayName}</UserName>
            {facility?.name && <Facility>{facility.name}</Facility>}
            <Box display="flex" justifyContent="space-between">
              <Version>Version {packagej.version}</Version>
              <LogoutButton
                type="button"
                onClick={onLogout}
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
});
