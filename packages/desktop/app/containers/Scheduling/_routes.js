import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { NotActive } from '../NotActive';

export default function Routes({ url }) {
  return (
    <Switch>
      <Route exact path={url} component={NotActive} />
      <Route path={`${url}/week`} component={NotActive} />
      <Route path={`${url}/today`} component={NotActive} />
      <Route path={`${url}/search`} component={NotActive} />
      <Route path={`${url}/calendar`} component={NotActive} />
      <Route path={`${url}/appointmentByPatient/:patientId`} component={NotActive} />
      <Route path={`${url}/appointment/new`} component={NotActive} />
      <Route path={`${url}/appointment/:id`} component={NotActive} />
      <Route path={`${url}/theater`} component={NotActive} />
      <Route path={`${url}/surgery/new`} component={NotActive} />
      <Route path={`${url}/surgery/:id`} component={NotActive} />
    </Switch>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
