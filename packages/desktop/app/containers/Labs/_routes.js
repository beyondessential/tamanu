import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { LabRequests } from './LabRequests';
import { PublishedLabRequests } from './PublishedLabRequests';
import { LabRequestDisplay } from './LabRequestDisplay';
import RequestForm from './Request';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={LabRequests} />
        <Route path={`${url}/requests`} component={LabRequests} />
        <Route path={`${url}/request/by-patient/:patientId/:id`} component={RequestForm} />
        <Route path={`${url}/request/by-patient/:patientId`} component={RequestForm} />
        <Route path={`${url}/request/:id`} component={LabRequestDisplay} />
        <Route path={`${url}/request`} component={RequestForm} />
        <Route path={`${url}/completed`} component={PublishedLabRequests} />
        <Route path={`${url}/edit/new`} component={RequestForm} />
        <Route path={`${url}/edit/:id`} component={RequestForm} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
