import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Box, Button, Divider, IconButton, List, Typography } from '@material-ui/core';
import { NavigateBefore, NavigateNext } from '@material-ui/icons';
import { useNavigate, useLocation } from 'react-router';
import { TranslatedText, TranslatedReferenceData } from '@tamanu/ui-components';
import { LogoLight, LogoLightNoText } from '../Logo';
import { Colors } from '../../constants';
import { HiddenSyncAvatar } from '../HiddenSyncAvatar';
import { TopLevelSidebarItem } from './TopLevelSidebarItem';
import { PrimarySidebarItem } from './PrimarySidebarItem';
import { SecondarySidebarItem } from './SecondarySidebarItem';
import { checkAbility } from '../../utils/ability';
import { FULL_VERSION } from '../../utils/env';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api';
import { KebabMenu } from './KebabMenu';
import { ImpersonationPopover } from './ImpersonationSelector';
import { NoteModalActionBlocker } from '../NoteModalActionBlocker';

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

const ExtendedLogo = styled(LogoLight)``;

const RetractedLogo = styled(LogoLightNoText)``;

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
  margin-left: 10px;
  min-height: 0;
  min-width: 0;
  padding-left: 0;
  padding-right: 0;
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
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const avatarRef = useRef(null);
  const api = useApi();
  const { facilityId, currentUser, onLogout, currentRole, impersonatingRole } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const extendSidebar = () => setIsRetracted(false);

  const onPathChanged = newPath => navigate(newPath);

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
  const isAdmin = currentUser?.role === 'admin';
  const roleName = impersonatingRole
    ? `${impersonatingRole.name} (impersonating)`
    : (currentRole?.name ?? currentUser?.role);

  const { data: facility, isLoading: isFacilityLoading } = useQuery(
    ['facility', facilityId],
    async () => await api.get(`facility/${encodeURIComponent(facilityId)}`),
    {
      enabled: !!facilityId,
    },
  );

  const connectionName = useMemo(() => {
    if (isFacilityLoading) {
      return '';
    }
    if (!facility) {
      return (
        <TranslatedText
          stringId="general.meta.centralServer"
          fallback="Central admin server"
          data-testid="translatedtext-rv78"
        />
      );
    }
    return (
      <TranslatedReferenceData
        fallback={facility.name}
        value={facility.id}
        category="facility"
        data-testid="translatedreferencedata-4bgq"
      />
    );
  }, [facility, isFacilityLoading]);

  return (
    <Container $retracted={isRetracted} data-testid="container-wiqr">
      <HeaderContainer $retracted={isRetracted} data-testid="headercontainer-rg0x">
        {isRetracted ? (
          <>
            <RetractedLogo height="31px" data-testid="retractedlogo-h4sf" />
            <ExtendButton
              onClick={handleExtendButtonClick}
              color="secondary"
              size="medium"
              data-testid="extendbutton-c1vl"
            >
              <NavigateNext data-testid="navigatenext-q9ro" />
            </ExtendButton>
          </>
        ) : (
          <>
            <ExtendedLogo height="31px" data-testid="extendedlogo-cc0l" />
            <RetractButton
              onClick={handleRetractButtonClick}
              color="secondary"
              size="medium"
              data-testid="retractbutton-f6p7"
            >
              <NavigateBefore data-testid="navigatebefore-ffig" />
            </RetractButton>
          </>
        )}
      </HeaderContainer>
      <List component="nav" data-testid="list-zolh">
        {items.map((item, i) => {
          const commonProps = {
            retracted: isRetracted,
            icon: item.icon,
            label: item.label,
            divider: i === items.length - 1 && item.divider, // Only the bottom item can have a divider
            path: item.path,
            highlighted: isHighlighted(
              currentPath,
              item.path,
              selectedParentItem === item.key,
              isRetracted,
            ),
            selected: selectedParentItem === item.key,
            onClick: () => clickedParentItem(item),
          };

          const dataTestIdSuffix = item.path.replace(/\//g, '-');

          if (item.Component) {
            const { Component } = item;
            return (
              <Component
                {...commonProps}
                key={item.key}
                data-testid={`component-itt0${dataTestIdSuffix}`}
              />
            );
          }

          if (!item.children) {
            return (
              <NoteModalActionBlocker key={item.path} isNavigationBlock>
                <TopLevelSidebarItem
                  key={item.path}
                  {...commonProps}
                  isCurrent={currentPath.includes(item.path)}
                  disabled={!permissionCheck(item)}
                  onClick={isRetracted ? extendSidebar : () => onPathChanged(item.path)}
                  data-testid={`toplevelsidebaritem-i3fu${dataTestIdSuffix}`}
                />
              </NoteModalActionBlocker>
            );
          }

          if (isRetracted) {
            return (
              <PrimarySidebarItem
                key={item.path}
                {...commonProps}
                data-testid={`primarysidebaritem-3d3f${dataTestIdSuffix}`}
              />
            );
          }
          return (
            <PrimarySidebarItem
              key={item.path}
              {...commonProps}
              data-testid={`primarysidebaritem-o312${dataTestIdSuffix}`}
            >
              {item.children.map(child => (
                <NoteModalActionBlocker key={child.path} isNavigationBlock>
                  <SecondarySidebarItem
                    key={child.path}
                    path={child.path}
                    isCurrent={currentPath.includes(child.path)}
                    color={child.color}
                    label={child.label}
                    disabled={!permissionCheck(child, item)}
                    onClick={() => onPathChanged(child.path)}
                    data-testid={`secondarysidebaritem-3o07-${dataTestIdSuffix}`}
                  />
                </NoteModalActionBlocker>
              ))}
            </PrimarySidebarItem>
          );
        })}
      </List>
      <Footer $retracted={isRetracted} data-testid="footer-ymwe">
        <StyledDivider $invisible={isRetracted} data-testid="styleddivider-hx9s" />
        <UserInfo $retracted={isRetracted} data-testid="userinfo-covo">
          <StyledHiddenSyncAvatar
            ref={avatarRef}
            $retracted={isRetracted}
            onClick={isRetracted ? extendSidebar : undefined}
            onMetaClick={isAdmin ? () => setImpersonateOpen(true) : undefined}
            impersonating={!!impersonatingRole}
            data-testid="styledhiddensyncavatar-0pir"
          >
            {initials}
          </StyledHiddenSyncAvatar>
          {!isRetracted && (
            <>
              <StyledUserInfoContent flex={1} data-testid="styleduserinfocontent-2x2p">
                <UserName data-testid="username-p59p">{currentUser?.displayName}</UserName>
                <Box display="flex" justifyContent="space-between" data-testid="box-idqw">
                  <ConnectedTo data-testid="connectedto-6awb">
                    {roleName} <br /> {connectionName}
                  </ConnectedTo>
                </Box>
              </StyledUserInfoContent>
              <KebabMenu data-testid="kebabmenu-65zk" />
            </>
          )}
        </UserInfo>
        {isAdmin && (
          <ImpersonationPopover
            anchorEl={avatarRef.current}
            open={impersonateOpen}
            onClose={() => setImpersonateOpen(false)}
          />
        )}
        {!isRetracted && (
          <>
            <StyledDivider $invisible={isRetracted} data-testid="styleddivider-seqb" />
            <StyledMetadataBox
              display="flex"
              justifyContent="space-between"
              data-testid="styledmetadatabox-u53t"
            >
              <Version title={FULL_VERSION} data-testid="version-oxic">
                <TranslatedText
                  stringId="general.meta.version"
                  fallback="Version"
                  data-testid="translatedtext-7m4p"
                />{' '}
                {api.agentVersion}
              </Version>
              <NoteModalActionBlocker isNavigationBlock>
                <LogoutButton
                  type="button"
                  onClick={onLogout}
                  id="logout"
                  data-test-id="siderbar-logout-item"
                  data-testid="logoutbutton-4zn4"
                >
                  <TranslatedText
                    stringId="auth.action.logout"
                    fallback="Log out"
                    data-testid="translatedtext-sasg"
                  />
                </LogoutButton>
              </NoteModalActionBlocker>
            </StyledMetadataBox>
          </>
        )}
      </Footer>
    </Container>
  );
});
