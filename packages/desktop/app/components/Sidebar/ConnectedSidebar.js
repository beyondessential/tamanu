import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { items } from './config';
import { checkAbility } from '../../utils/ability-context';
import { SidebarWithPrograms } from './SidebarWithPrograms';

function mapStateToProps(state) {
  const { pathname: currentPath } = state.router.location;

  const permissionCheck = (child, parent) => {
    const ability = { ...child.ability, ...parent.ability };
    if (!ability.subject || !ability.action) {
      return true;
    }
    return checkAbility(ability);
  };

  return { currentPath, items, permissionCheck };
}

const mapDispatchToProps = dispatch => ({
  onPathChanged: newPath => dispatch(push(newPath)),
  onLogout: () => {
    throw new Error('Not implemented');
  },
});

export const ConnectedSidebar = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SidebarWithPrograms);
