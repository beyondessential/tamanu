import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Invoices from './Invoices';
import NewInvoice from './NewInvoice';
import Prices from './Prices';
import PriceProfiles from './PriceProfiles';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Invoices} />
        <Route path={`${url}/edit/new`} component={NewInvoice} />
        <Route path={`${url}/pricing`} component={Prices} />
        <Route path={`${url}/profiles`} component={PriceProfiles} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
