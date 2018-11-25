import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import CurrentIncidents from './CurrentIncidents';
import NewIncident from './NewIncident';
import History from './History';
import Reports from './Reports';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={CurrentIncidents} />
        <Route path={`${url}/edit/new`} component={NewIncident} />
        <Route path={`${url}/completed`} component={History} />
        <Route path={`${url}/reports`} component={Reports} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
