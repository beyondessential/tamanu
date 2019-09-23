import React from 'react';
import styled from 'styled-components';
import ListItem from '@material-ui/core/ListItem';
import { SidebarItemText } from './SidebarItemText';

const Icon = styled.i`
  margin-right: 5px;
`;

export const SecondarySidebarItem = React.memo(
  ({ path, icon, label, isCurrent, disabled, onClick }) => (
    <ListItem button to={path} disabled={disabled} selected={isCurrent} onClick={onClick}>
      <Icon className={icon} />
      <SidebarItemText disableTypography primary={label} />
    </ListItem>
  ),
);
