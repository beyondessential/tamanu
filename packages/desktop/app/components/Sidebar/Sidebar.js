import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { List, Divider, Box, Typography, Button, IconButton } from '@material-ui/core';
import { NavigateBefore, NavigateNext, Launch } from '@material-ui/icons';

import { TamanuLogoWhite, TamanuLogoWhiteNoText } from '../TamanuLogo';
import { Colors } from '../../constants';
import { HiddenSyncAvatar } from '../HiddenSyncAvatar';
import { TopLevelSidebarItem } from './TopLevelSidebarItem';
import { PrimarySidebarItem } from './PrimarySidebarItem';
import { SecondarySidebarItem } from './SecondarySidebarItem';
import { getCurrentRoute } from '../../store/router';
import { checkAbility } from '../../utils/ability';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api';
import { TranslatedText } from '../Translation/TranslatedText';
import { useLocalisation } from '../../contexts/Localisation';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background: ${Colors.primaryDark};
  min-width: ${props => (props.$retracted ? '60px' : '260px')};
  max-width: ${props => (props.$retracted ? '86px' : '280px')};
  padding: 0 15px;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.15);
  color: ${Colors.white};
  overflow-y: auto;
  overflow-x: hidden;
  height: 100vh;
  transition: ${props => props.theme.transitions.create(['min-width', 'max-width'])};

  i {
    color: ${Colors.white};
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: ${props => (props.$retracted ? 'center' : 'space-between')};
  height: 72px;
  padding: 16px 0 14px ${props => (props.$retracted ? '0' : '13px')};
`;

const RetractExtendButton = styled(IconButton)`
  padding: 8px;
  background-color: ${Colors.primaryDark};

  &.MuiIconButton-root:hover {
    background-color: #4e5f71;
  }
`;

const RetractButton = styled(RetractExtendButton)``;

const ExtendButton = styled(RetractExtendButton)`
  position: fixed;
  z-index: 12;
  transform: translate(100%);
`;

const ExtendedLogo = styled(TamanuLogoWhite)``;

const RetractedLogo = styled(TamanuLogoWhiteNoText)``;

const Footer = styled.div`
  margin-top: auto;
  padding-bottom: 3px;
  padding-right: ${props => (props.$retracted ? '0' : '10px')};
`;

const UserInfo = styled.div`
  display: flex;
  color: white;
  min-height: 65px;
  align-items: center;
  justify-content: ${props => (props.$retracted ? 'center' : 'default')};
  transition: ${props => props.theme.transitions.create('justify-content')};
  margin-top: 5px;
  margin-bottom: 5px;
`;

const StyledUserInfoContent = styled(Box)`
  margin-top: 8px;
`;

const StyledDivider = styled(Divider)`
  background-color: ${props => (props.$invisible ? 'transparent' : 'rgba(255, 255, 255, 0.2)')};
  transition: ${props => props.theme.transitions.create('background-color')};
  margin-left: 5px;
`;

const UserName = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
`;

const ConnectedTo = styled(Typography)`
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
`;

const StyledHiddenSyncAvatar = styled(HiddenSyncAvatar)`
  margin-right: ${props => (props.$retracted ? '0' : '12px')};
  cursor: ${props => (props.$retracted ? 'pointer' : 'default')};
`;

const Version = styled.div`
  font-size: 9px;
  line-height: 15px;
  font-weight: 400;
  margin-top: 6px;
  color: ${Colors.softText};
`;

const LogoutButton = styled(Button)`
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  text-transform: none;
  text-decoration: underline;
  color: ${Colors.white};
  margin-top: 8px;
  margin-left: 10px;
  min-height: 0;
  min-width: 0;
  padding-left: 0;
  padding-right: 0;
`;

const SupportDesktopLink = styled.a`
  margin-top: 4px;
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  text-decoration: underline;
  color: ${Colors.white};
  display: flex;
  align-items: center;
  justify-content: center;

  :hover {
    font-weight: bold;
  }
`;

const StyledMetadataBox = styled(Box)`
  margin-bottom: 5px;
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
const isHighlighted = (currentPath, menuItemPath, sectionIsOpen, isRetracted) => {
  // remove leading slashes to get a like for like comparison
  const sectionPath = currentPath.replace(/^\/|\/$/g, '').split('/')[0];
  const itemPath = menuItemPath.replace(/^\/|\/$/g, '');
  // If the section is open, the child menu item is highlighted and the top level menu item is not
  return sectionPath === itemPath && (!sectionIsOpen || isRetracted);
};

export const Sidebar = React.memo(({ items }) => {
  const [selectedParentItem, setSelectedParentItem] = useState('');
  const [isRetracted, setIsRetracted] = useState(false);
  const { appVersion } = useApi();
  const { facility, centralHost, currentUser, onLogout, currentRole } = useAuth();
  const currentPath = useSelector(getCurrentRoute);
  const dispatch = useDispatch();
  const { getLocalisation } = useLocalisation();

  const extendSidebar = () => setIsRetracted(false);

  const onPathChanged = newPath => dispatch(push(newPath));

  const clickedParentItem = ({ key }) => {
    if (isRetracted) {
      extendSidebar();
      setSelectedParentItem(key);
    } else if (selectedParentItem === key) {
      setSelectedParentItem('');
    } else {
      setSelectedParentItem(key);
    }
  };

  const handleRetractButtonClick = useCallback(() => setIsRetracted(true), []);

  const handleExtendButtonClick = useCallback(extendSidebar, []);

  const initials = getInitials(currentUser.displayName);
  const roleName = currentRole?.name ?? currentUser?.role;
  const supportUrl = getLocalisation('supportDeskUrl');

  return (
    <Container $retracted={isRetracted}>
      <HeaderContainer $retracted={isRetracted}>
        {isRetracted ? (
          <>
            <RetractedLogo height="31px" />
            <ExtendButton onClick={handleExtendButtonClick} color="secondary" size="medium">
              <NavigateNext />
            </ExtendButton>
          </>
        ) : (
          <>
            <ExtendedLogo height="31px" />
            <RetractButton onClick={handleRetractButtonClick} color="secondary" size="medium">
              <NavigateBefore />
            </RetractButton>
          </>
        )}
      </HeaderContainer>
      <List component="nav">
        {items.map(item =>
          item.children ? (
            <PrimarySidebarItem
              retracted={isRetracted}
              icon={item.icon}
              label={item.label}
              divider={item.divider}
              key={item.key}
              highlighted={isHighlighted(
                currentPath,
                item.path,
                selectedParentItem === item.key,
                isRetracted,
              )}
              selected={selectedParentItem === item.key}
              onClick={() => clickedParentItem(item)}
            >
              {!isRetracted &&
                item.children.map(child => (
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
              retracted={isRetracted}
              icon={item.icon}
              path={item.path}
              label={item.label}
              divider={item.divider}
              key={item.key}
              isCurrent={currentPath.includes(item.path)}
              disabled={!permissionCheck(item)}
              onClick={isRetracted ? extendSidebar : () => onPathChanged(item.path)}
            />
          ),
        )}
      </List>
      <Footer $retracted={isRetracted}>
        <StyledDivider $invisible={isRetracted} />
        <UserInfo $retracted={isRetracted}>
          <StyledHiddenSyncAvatar
            $retracted={isRetracted}
            onClick={isRetracted ? extendSidebar : undefined}
          >
            {initials}
          </StyledHiddenSyncAvatar>
          {!isRetracted && (
            <StyledUserInfoContent flex={1}>
              <UserName>{currentUser?.displayName}</UserName>
              <Box display="flex" justifyContent="space-between">
                <ConnectedTo>
                  {roleName} <br /> {facility?.name ? facility.name : centralHost}
                </ConnectedTo>
                <LogoutButton
                  type="button"
                  onClick={onLogout}
                  id="logout"
                  data-test-id="siderbar-logout-item"
                >
                  <TranslatedText stringId="auth.action.logout" fallback="Log out" />
                </LogoutButton>
              </Box>
            </StyledUserInfoContent>
          )}
        </UserInfo>
        {!isRetracted && (
          <>
            <StyledDivider $invisible={isRetracted} />
            <StyledMetadataBox display="flex" justifyContent="space-between">
              <SupportDesktopLink href={supportUrl} target="_blank" rel="noreferrer">
                Support centre
                <Launch style={{ marginLeft: '5px', fontSize: '12px' }} />
              </SupportDesktopLink>
              <Version>Version {appVersion}</Version>
            </StyledMetadataBox>
          </>
        )}
      </Footer>
    </Container>
  );
});
