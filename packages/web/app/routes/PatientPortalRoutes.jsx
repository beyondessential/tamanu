import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PatientPortalView } from '../views/PatientPortalView';
import { PatientPortalLoginView } from '../views/PatientPortalLoginView';
import { PatientPortalSurveyView } from '../views/PatientPortalSurveyView';

export const PatientPortalRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/:patientId/survey/:surveyId/encounter/:encounterId`} component={PatientPortalSurveyView} />
    <Route path={`${match.path}/login/:patientId`} component={PatientPortalLoginView} />
    <Route path={`${match.path}/:patientId`} component={PatientPortalView} />
    <Redirect to={`${match.path}/login`} />
  </Switch>
));