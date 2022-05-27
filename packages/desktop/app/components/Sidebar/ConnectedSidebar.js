import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { checkAbility } from '../../utils/ability';
import { Sidebar } from './Sidebar';
import { logout } from '../../store/auth';
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

export const ConnectedSidebar = connect(state => {
  const currentPath = getCurrentRoute(state);
  return { currentPath, permissionCheck };
}, mapDispatchToProps)(Sidebar);
