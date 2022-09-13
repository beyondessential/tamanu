import React from 'react';
import styled from 'styled-components';
import { ListItem, ListItemText, Divider } from '@material-ui/core';
import { administrationIcon } from '../../constants/images';

const TopLevelListItem = styled(ListItem)`
  border-radius: 4px;
  padding-right: 10px;

  .MuiSvgIcon-root {
    position: relative;
    top: -1px;
    opacity: 0.9;
    font-size: 22px;
    transform: rotate(0deg);
  }

  background: ${props => (props.selected ? 'rgba(255, 255, 255, 0.15)' : '')};

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SidebarTopLevelIcon = styled.img`
  width: 22px;
  height: 22px;
  border: none;
`;

const TopLevelItemText = styled(ListItemText)`
  padding-left: 10px;
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  letter-spacing: 0;
`;

const ListDivider = styled(Divider)`
  background-color: rgba(255, 255, 255, 0.2);
  margin: 2px 10px 2px 16px;
`;

export const TopLevelSidebarItem = ({
  icon,
  path,
  label,
  isCurrent,
  disabled,
  onClick,
  divider,
}) => (
  <>
    {divider && <ListDivider />}
    <TopLevelListItem
      button
      to={path}
      onClick={onClick}
      selected={isCurrent}
      disabled={disabled}
      data-test-class="toplevel-sidebar-item"
    >
      <SidebarTopLevelIcon src={icon || administrationIcon} />
      <TopLevelItemText disableTypography primary={label} />
    </TopLevelListItem>
  </>
);
