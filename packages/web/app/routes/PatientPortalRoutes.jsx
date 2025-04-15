import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PatientPortalMobileSurveyResponseForm } from '../views/patientPortal/PatientPortalMobileSurveyResponseForm';
import { PatientPortal } from '../views/patientPortal/PatientPortal';
import { PatientProvider } from '../contexts/Patient';
import { PatientPortalLoginForm } from '../views/patientPortal/LoginScreen';

export const PatientPortalRoutes = React.memo(({ match }) => (
  <PatientProvider>
    <Switch>
      <Route
        path={`${match.path}/surveys/:surveyId`}
        component={PatientPortalMobileSurveyResponseForm}
      />
      <Route path={`${match.path}/login/:encounterId`} component={PatientPortalLoginForm} />
      <Route path="/patient-portal" component={PatientPortal} />
      {/* Redirect to patient portal home when no specific route is matched */}
      <Redirect to={`/patient-portal`} />
    </Switch>
  </PatientProvider>
));
