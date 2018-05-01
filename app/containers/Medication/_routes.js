import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Requests from './Requests';
import Completed from './Completed';
import NewMedication from './NewMedication';
import Dispense from './Dispense';
import ReturnMedication from './ReturnMedication';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Requests} />
        <Route path={`${url}/completed`} component={Completed} />
        <Route path={`${url}/edit/new`} component={NewMedication} />
        <Route path={`${url}/edit/dispense`} component={Dispense} />
        <Route path={`${url}/return/new`} component={ReturnMedication} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
