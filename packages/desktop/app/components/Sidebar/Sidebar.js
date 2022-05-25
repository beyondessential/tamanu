import React, { useState } from 'react';
import styled from 'styled-components';
import { ListItem, ListItemText, Divider, List, Collapse } from '@material-ui/core';
import { TamanuLogoWhite } from '../TamanuLogo';
import { version } from '../../../package.json';
import { FacilityNameDisplay } from '../FacilityNameDisplay';
import { Colors } from '../../constants';
import { administrationIcon, logoutIcon } from '../../constants/images';
import { Translated } from '../Translated';

const Container = styled.div`
  background: ${Colors.primaryDark};
  min-width: 260px;
  padding: 0 15px;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.15);
  color: ${Colors.white};

  i {
    color: ${Colors.white};
  }
`;

const PrimaryListItem = styled(ListItem)`
  border-radius: 4px;

  &.Mui-selected {
    background: none;
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
  color: white;
  padding-left: 10px;

  //font-size: 1.05rem;
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  letter-spacing: 0;

  &::first-letter {
    text-transform: uppercase;
  }
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

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SecondaryItemText = styled(ListItemText)`
  color: white;

  font-size: 14px;
  line-height: 18px;
  font-weight: 400;
  letter-spacing: 0;

  &::first-letter {
    text-transform: uppercase;
  }
`;

const SecondarySidebarItem = ({ path, label, isCurrent, disabled, onClick }) => (
  <SecondaryListItem
    button
    to={path}
    disabled={disabled}
    selected={isCurrent}
    onClick={onClick}
    data-test-class="secondary-sidebar-item"
  >
    <SecondaryItemText disableTypography primary={label} />
  </SecondaryListItem>
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
  margin: 24px 0 10px 18px;
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
          <PrimaryItemText disableTypography primary={<Translated id="logout" />} />
        </ListItem>
      </div>
      <AdditionalInfo>
        <div>Version {version}</div>
        <FacilityNameDisplay />
      </AdditionalInfo>
    </Container>
  );
};
