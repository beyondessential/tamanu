import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import LookupList from './LookupList';
import AddressFields from './AddressFields';
import CustomFoms from './CustomFoms';
import IncidentCategories from './IncidentCategories';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={LookupList} />
        <Route path={`${url}/address`} component={AddressFields} />
        <Route path={`${url}/custom-forms`} component={CustomFoms} />
        <Route path={`${url}/inc-category`} component={IncidentCategories} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
