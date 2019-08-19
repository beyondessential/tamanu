import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const ProgramsRoutes = React.memo(({ match }) => {
  return (
    <Switch>
      <Route exact path={match.path} component={NotActiveView} />
      <Route
        path={`${match.path}/:programId/:patientId/:surveyId/responses/:responseId`}
        component={NotActiveView}
      />
      <Route
        path={`${match.path}/:programId/:patientId/:surveyId/:moduleId/responses`}
        component={NotActiveView}
      />
      <Route
        path={`${match.path}/:programId/:patientId/:surveyId/responses`}
        component={NotActiveView}
      />
      <Route
        path={`${match.path}/:programId/:patientId/surveys/:surveyId/module/:moduleId`}
        component={NotActiveView}
      />
      <Route
        path={`${match.path}/:programId/:patientId/surveys/module/:moduleId`}
        component={NotActiveView}
      />
      <Route
        path={`${match.path}/:programId/:patientId/surveys/:surveyId`}
        component={NotActiveView}
      />
      <Route path={`${match.path}/:programId/:patientId/surveys`} component={NotActiveView} />
      <Route path={`${match.path}/:programId/patients`} component={NotActiveView} />
    </Switch>
  );
});
