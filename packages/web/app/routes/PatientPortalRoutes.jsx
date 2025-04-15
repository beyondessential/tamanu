import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PatientPortalMobileSurveyResponseForm } from '../views/patientPortal/PatientPortalMobileSurveyResponseForm';
import { PatientPortalSurveysList } from '../views/patientPortal/PatientPortalSurveysList';
import { PatientPortal } from '../views/patientPortal/PatientPortal';

export const PatientPortalRoutes = React.memo(({ match }) => (
  <Switch>
    <Route exact path={`${match.path}/surveys`} component={PatientPortalSurveysList} />
    <Route
      path={`${match.path}/surveys/:surveyId`}
      component={PatientPortalMobileSurveyResponseForm}
    />
    <Route path="/patient-portal" component={PatientPortal} />
    {/* Redirect to patient portal home when no specific route is matched */}
    <Redirect to={`/patient-portal`} />
  </Switch>
));
