import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { items } from './config';
import { checkAbility } from '../../utils/ability';
import { SidebarWithPrograms } from './SidebarWithPrograms';
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

export const ConnectedSidebar = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SidebarWithPrograms);
