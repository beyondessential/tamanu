import React from 'react';
import styled from 'styled-components';
import MuiListItem from '@material-ui/core/ListItem';
import { SidebarItemText } from './SidebarItemText';

const ListItem = styled(MuiListItem)`
  padding: 2px 0 2px 32px;
`;

export const SecondarySidebarItem = React.memo(
  ({ path, icon, label, isCurrent, disabled, onClick }) => (
    <ListItem button to={path} disabled={disabled} selected={isCurrent} onClick={onClick}>
      <i className={icon} />
      <SidebarItemText disableTypography primary={label} />
    </ListItem>
  ),
);
