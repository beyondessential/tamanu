import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PatientPortalMobileSurveyResponseForm } from '../views/patientPortal/PatientPortalMobileSurveyResponseForm';
import { PatientPortalSurveysList } from '../views/patientPortal/PatientPortalSurveysList';

export const PatientPortalRoutes = React.memo(({ match }) => (
  <Switch>
    <Route exact path={`${match.path}/surveys`} component={PatientPortalSurveysList} />
    <Route
      path={`${match.path}/surveys/:surveyId`}
      component={PatientPortalMobileSurveyResponseForm}
    />
    {/* Redirect to surveys list when no specific route is matched */}
    <Redirect to={`${match.path}/surveys`} />
  </Switch>
));
