import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import BilledInvoices from './BilledInvoices';
import DraftInvoices from './DraftInvoices';
import AllInvoices from './AllInvoices';
import PaidInvoices from './PaidInvoices';
import NewInvoice from './NewInvoice';
import AllPricingItems from './AllPricingItems';
import ImagingPricing from './ImagingPricing';
import LabPricing from './LabPricing';
import ProcedurePricing from './ProcedurePricing';
import WardPricing from './WardPricing';
import PricingProfiles from './PricingProfiles';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={BilledInvoices} />
        <Route exact path={`${url}/draft`} component={DraftInvoices} />
        <Route exact path={`${url}/all`} component={AllInvoices} />
        <Route exact path={`${url}/paid`} component={PaidInvoices} />
        <Route exact path={`${url}/edit/new`} component={NewInvoice} />
        <Route exact path={`${url}/pricing`} component={AllPricingItems} />
        <Route exact path={`${url}/pricing/imaging`} component={ImagingPricing} />
        <Route exact path={`${url}/pricing/lab`} component={LabPricing} />
        <Route exact path={`${url}/pricing/procedure`} component={ProcedurePricing} />
        <Route exact path={`${url}/pricing/ward`} component={WardPricing} />
        <Route exact path={`${url}/pricing/profiles`} component={PricingProfiles} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
