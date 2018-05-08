import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import LookupList from './LookupList';
import AddressFields from './AddressFields';
import Shortcodes from './Shortcodes';
import PrintHeader from './PrintHeader';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={LookupList} />
        <Route path={`${url}/address`} component={AddressFields} />
        <Route path={`${url}/textreplace`} component={Shortcodes} />
        <Route path={`${url}/print-header`} component={PrintHeader} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
