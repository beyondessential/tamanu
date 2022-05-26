import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { facilityItems, syncItems } from './config';
import { checkAbility } from '../../utils/ability';
import { Sidebar } from './Sidebar';
import { FacilitySidebar } from './FacilitySidebar';
import { logout, getFacilityName, getCurrentUser } from '../../store/auth';
import { getCurrentRoute } from '../../store/router';

const permissionCheck = (child, parent) => {
  const ability = { ...child.ability, ...parent.ability };
  if (!ability.subject || !ability.action) {
    return true;
  }
  return checkAbility(ability);
};

const mapDispatchToProps = dispatch => ({
  onPathChanged: newPath => dispatch(push(newPath)),
  onLogout: () => dispatch(logout()),
});

const getSidebarState = state => ({
  currentPath: getCurrentRoute(state),
  facilityName: getFacilityName(state),
  currentUser: getCurrentUser(state),
  permissionCheck,
  items: facilityItems,
});

export const ConnectedFacilitySidebar = connect(
  state => getSidebarState(state),
  mapDispatchToProps,
)(FacilitySidebar);

export const ConnectedSyncSidebar = connect(
  state => ({ ...getSidebarState(state), items: syncItems, permissionCheck }),
  mapDispatchToProps,
)(Sidebar);
