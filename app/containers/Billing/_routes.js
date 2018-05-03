import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import BilledInvoices from './BilledInvoices';
import DraftInvoices from './DraftInvoices';
import AllInvoices from './AllInvoices';
import PaidInvoices from './PaidInvoices';
import NewInvoice from './NewInvoice';
import Prices from './Prices';
import PriceProfiles from './PriceProfiles';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={BilledInvoices} />
        <Route exact path={`${url}/draft`} component={DraftInvoices} />
        <Route exact path={`${url}/all`} component={AllInvoices} />
        <Route exact path={`${url}/paid`} component={PaidInvoices} />
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
