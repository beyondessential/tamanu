import React from 'react';
import styled from 'styled-components';
import { ListItem, ListItemText, Divider } from '@material-ui/core';
import { administrationIcon } from '../../constants/images';
import { ThemedTooltip } from '../Tooltip';

const TopLevelListItem = styled(ListItem)`
  border-radius: 4px;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-right: 10px;
  margin-bottom: 5px;

  .MuiSvgIcon-root {
    position: relative;
    top: -1px;
    opacity: 0.9;
    font-size: 22px;
    transform: rotate(0deg);
  }

  &.Mui-selected {
    background: ${props => (props.selected ? 'rgba(255, 255, 255, 0.15)' : '')};
  }

  &:hover,
  &.Mui-selected:hover {
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
  color: ${props => (props.$invisible ? 'transparent' : '')};
  max-height: ${props => (props.$invisible ? '18px' : 'default')};
  transition: ${props => props.theme.transitions.create(['color', 'max-height'])};
`;

const ListDivider = styled(Divider)`
  background-color: rgba(255, 255, 255, 0.2);
  margin: 2px 10px 2px 16px;
`;

const StyledTooltip = styled(ThemedTooltip)`
  .MuiTooltip-tooltip {
    margin-bottom: -10px;
    margin-left: 25px;
    padding: 10px;
  }
  .MuiTooltip-arrow {
    transform: translate(-90%);
  }
`;

export const TopLevelSidebarItem = ({
  icon,
  path,
  label,
  isCurrent,
  disabled,
  onClick,
  divider,
  retracted,
}) => (
  <>
    {divider && <ListDivider />}
    <StyledTooltip title={retracted ? label : ''} placement="top-end" arrow>
      <TopLevelListItem
        button
        to={path}
        onClick={onClick}
        selected={isCurrent}
        disabled={disabled}
        data-test-class="toplevel-sidebar-item"
      >
        <SidebarTopLevelIcon src={icon || administrationIcon} />
        <TopLevelItemText disableTypography primary={label} $invisible={retracted} />
      </TopLevelListItem>
    </StyledTooltip>
  </>
);
