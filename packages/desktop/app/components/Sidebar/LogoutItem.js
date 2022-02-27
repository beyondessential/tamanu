import React from 'react';
import ListItem from '@material-ui/core/ListItem';

import { Translated } from '../Translated';
import { logoutIcon } from '../../constants/images';
import { SidebarItemText } from './SidebarItemText';
import { SidebarPrimaryIcon } from './SidebarPrimaryIcon';

export const LogoutItem = React.memo(({ onClick }) => (
  <ListItem button onClick={onClick} data-test-id="siderbar-logout-item">
    <SidebarPrimaryIcon src={logoutIcon} />
    <SidebarItemText disableTypography primary={<Translated id="logout" />} />
  </ListItem>
));
