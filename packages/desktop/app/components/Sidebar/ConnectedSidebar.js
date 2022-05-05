import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { items } from './config';
import { checkAbility } from '../../utils/ability';
import { Sidebar } from './Sidebar';
import { FacilitySidebar } from './FacilitySidebar';
import { logout } from '../../store/auth';
import { getCurrentRoute } from '../../store/router';

const permissionCheck = (child, parent) => {
  const ability = { ...child.ability, ...parent.ability };
  if (!ability.subject || !ability.action) {
    return true;
  }
  return checkAbility(ability);
};

function mapStateToProps(state) {
  const currentPath = getCurrentRoute(state);
  return { currentPath, items, permissionCheck };
}

const mapDispatchToProps = dispatch => ({
  onPathChanged: newPath => dispatch(push(newPath)),
  onLogout: () => dispatch(logout()),
});

export const ConnectedFacilitySidebar = connect(mapStateToProps, mapDispatchToProps)(FacilitySidebar);
export const ConnectedSyncSidebar = connect(mapStateToProps, mapDispatchToProps)(Sidebar);
