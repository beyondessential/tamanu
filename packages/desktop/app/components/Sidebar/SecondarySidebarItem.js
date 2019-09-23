import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import { SidebarItemText } from './SidebarItemText';

export const SecondarySidebarItem = React.memo(
  ({ path, icon, label, isCurrent, disabled, onClick }) => (
    <ListItem button to={path} disabled={disabled} selected={isCurrent} onClick={onClick}>
      <i className={icon} />
      <SidebarItemText disableTypography primary={label} />
    </ListItem>
  ),
);
