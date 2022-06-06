import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { List, Divider, Box, Typography, Avatar, Button } from '@material-ui/core';
import { TamanuLogoWhite } from '../TamanuLogo';
import { Colors } from '../../constants';
import { version } from '../../../package.json';
import { Translated } from '../Translated';
import { PrimarySidebarItem } from './PrimarySidebarItem';
import { SecondarySidebarItem } from './SecondarySidebarItem';
import { getCurrentRoute } from '../../store/router';
import { checkAbility } from '../../utils/ability';
import { useAuth } from '../../contexts/Auth';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background: ${Colors.primaryDark};
  min-width: 260px;
  max-width: 320px;
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

const permissionCheck = (child, parent) => {
  const ability = { ...child.ability, ...parent.ability };
  if (!ability.subject || !ability.action) {
    return true;
  }
  return checkAbility(ability);
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
            {facility?.name && <Facility>{facility.name}</Facility>}
            <Box display="flex" justifyContent="space-between">
              <Version>Version {version}</Version>
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
