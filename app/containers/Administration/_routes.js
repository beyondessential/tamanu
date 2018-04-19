import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import LoopupList from './LoopupList';
import AddressFields from './AddressFields';
import CustomFoms from './CustomFoms';
import IncidentCategories from './IncidentCategories';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={LoopupList} />
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
