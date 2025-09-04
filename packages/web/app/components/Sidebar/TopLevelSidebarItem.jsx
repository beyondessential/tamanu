import React, { isValidElement } from 'react';
import styled from 'styled-components';
import { Divider, ListItem, ListItemText } from '@mui/material';
import { administrationIcon } from '../../constants/images';
import { ThemedTooltip } from '../Tooltip';

const TopLevelListItem = styled(ListItem)`
  border-radius: 4px;
  margin-block-end: 5px;
  padding-block: 2px;
  padding-inline-end: 10px;

  .MuiSvgIcon-root {
    opacity: 0.9;
    font-size: 22px;
  }

  &:hover,
  &.Mui-selected,
  &.Mui-selected:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SidebarTopLevelIcon = styled.img`
  width: 22px;
  height: 22px;
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
}) => {
  const testIdSuffix = path.split('/').pop();
  return (
    <>
      {divider && <ListDivider data-testid={`listdivider-19k7-${testIdSuffix}`} />}
      <StyledTooltip
        title={retracted ? label : ''}
        placement="top-end"
        arrow
        data-testid={`styledtooltip-85bn-${testIdSuffix}`}
      >
        <TopLevelListItem
          button
          to={path}
          onClick={onClick}
          selected={isCurrent}
          disabled={disabled}
          data-test-class="toplevel-sidebar-item"
          data-testid={`toplevellistitem-a957-${testIdSuffix}`}
        >
          {isValidElement(icon) ? (
            icon
          ) : (
            <SidebarTopLevelIcon
              src={icon || administrationIcon}
              data-testid={`sidebartoplevelicon-hioy-${testIdSuffix}`}
            />
          )}
          <TopLevelItemText
            disableTypography
            primary={label}
            $invisible={retracted}
            data-testid={`toplevelitemtext-52i5-${testIdSuffix}`}
          />
        </TopLevelListItem>
      </StyledTooltip>
    </>
  );
};
