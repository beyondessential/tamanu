import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import LookupList from './LookupList';
import AddressFields from './AddressFields';
import Shortcodes from './Shortcodes';
import PrintHeader from './PrintHeader';
import Users from './Users';
import NewUser from './NewUser';
import UserRoles from './UserRoles';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={LookupList} />
        <Route path={`${url}/address`} component={AddressFields} />
        <Route path={`${url}/textreplace`} component={Shortcodes} />
        <Route path={`${url}/print-header`} component={PrintHeader} />
        <Route exact path={`${url}/users`} component={Users} />
        <Route path={`${url}/users/edit/new`} component={NewUser} />
        <Route path={`${url}/roles`} component={UserRoles} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
