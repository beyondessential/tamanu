import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';

import { SidebarPrimaryIcon } from './SidebarPrimaryIcon';
import { SidebarItemText } from './SidebarItemText';
import { administrationIcon } from '../../constants/images';

export const PrimarySidebarItem = React.memo(({ icon, label, children, selected, onClick }) => (
  <React.Fragment>
    <ListItem button onClick={onClick} selected={selected}>
      <SidebarPrimaryIcon src={icon || administrationIcon} />
      <SidebarItemText inset disableTypography primary={label} />
    </ListItem>
    <Collapse in={selected} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {children}
      </List>
    </Collapse>
  </React.Fragment>
));
