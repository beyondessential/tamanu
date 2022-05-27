import React from 'react';
import styled from 'styled-components';
import { ExpandMore } from '@material-ui/icons';
import { Collapse, List, ListItem, ListItemText } from '@material-ui/core';
import { administrationIcon } from '../../constants/images';

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

const StyledList = styled(List)`
  padding: 0 0 4px 0;
`;

export const PrimarySidebarItem = ({ icon, label, children, selected, onClick }) => (
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
      <StyledList component="div">{children}</StyledList>
    </Collapse>
  </>
);
