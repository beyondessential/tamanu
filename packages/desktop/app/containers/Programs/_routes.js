import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { NotActive } from '../NotActive';

export default function Routes({ url }) {
  return (
    <Switch>
      <Route exact path={url} component={NotActive} />
      <Route
        path={`${url}/:programId/:patientId/:surveyId/responses/:responseId`}
        component={NotActive}
      />
      <Route
        path={`${url}/:programId/:patientId/:surveyId/:moduleId/responses`}
        component={NotActive}
      />
      <Route path={`${url}/:programId/:patientId/:surveyId/responses`} component={NotActive} />
      <Route
        path={`${url}/:programId/:patientId/surveys/:surveyId/module/:moduleId`}
        component={NotActive}
      />
      <Route path={`${url}/:programId/:patientId/surveys/module/:moduleId`} component={NotActive} />
      <Route path={`${url}/:programId/:patientId/surveys/:surveyId`} component={NotActive} />
      <Route path={`${url}/:programId/:patientId/surveys`} component={NotActive} />
      <Route path={`${url}/:programId/patients`} component={NotActive} />
    </Switch>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
