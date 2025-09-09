import React from 'react';
import styled from 'styled-components';
import { ExpandMore } from '@mui/icons-material';
import { Collapse, Divider, List, ListItem, ListItemText } from '@mui/material';
import { administrationIcon } from '../../constants/images';
import { ThemedTooltip } from '../Tooltip';

const PrimaryListItem = styled(ListItem)`
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
    background: ${props =>
      props.$highlighted && props.$retracted ? 'rgba(255, 255, 255, 0.15)' : 'none'};
    transition: ${props => props.theme.transitions.create('background')};

    .MuiSvgIcon-root {
      transform: rotate(180deg);
    }
  }

  background: ${props => (props.$highlighted ? 'rgba(255, 255, 255, 0.15)' : '')};

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
  color: ${props => (props.$invisible ? 'transparent' : '')};
  max-height: ${props => (props.$invisible ? '18px' : 'default')};
  transition: ${props => props.theme.transitions.create(['color', 'max-height'])};
`;

const StyledList = styled(List)`
  padding: 0 0 4px 0;
`;

const ListDivider = styled(Divider)`
  background-color: rgba(255, 255, 255, 0.2);
  margin: ${props => (props.$retracted ? '2px 10px' : '2px 10px 2px 16px')};
  transition: ${props => props.theme.transitions.create('margin')};
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

/**
 *
 * selected: the list item has been clicked by the user and is open
 * highlighted: the list item should be highlighted
 */
export const PrimarySidebarItem = ({
  icon,
  label,
  path,
  children,
  selected,
  highlighted,
  onClick,
  divider,
  retracted,
}) => {
  const dataTestIdSuffix = path.replace(/\//g, '-');
  return (
    <>
      {divider && <ListDivider $retracted={retracted} data-testid="listdivider-4m9l" />}
      <StyledTooltip title={retracted ? label : ''} placement="top-end">
        <PrimaryListItem
          button
          onClick={onClick}
          selected={selected}
          $highlighted={highlighted}
          $retracted={retracted}
          data-testid={`primarylistitem${dataTestIdSuffix}`}
        >
          <SidebarPrimaryIcon
            src={icon || administrationIcon}
            $centered={retracted}
            data-testid="sidebarprimaryicon-yysn"
          />
          <PrimaryItemText
            disableTypography
            $invisible={retracted}
            primary={label}
            data-testid="primaryitemtext-000p"
          />
          {!retracted && <ExpandMore data-testid="expandmore-opqd" />}
        </PrimaryListItem>
      </StyledTooltip>
      <Collapse in={selected} timeout="auto" unmountOnExit data-testid="collapse-sns9">
        <StyledList component="div" data-testid="styledlist-mlft">
          {children}
        </StyledList>
      </Collapse>
    </>
  );
};
