import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const ProgramsRoutes = React.memo(({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url} component={NotActiveView} />
      <Route
        path={`${match.url}/:programId/:patientId/:surveyId/responses/:responseId`}
        component={NotActiveView}
      />
      <Route
        path={`${match.url}/:programId/:patientId/:surveyId/:moduleId/responses`}
        component={NotActiveView}
      />
      <Route
        path={`${match.url}/:programId/:patientId/:surveyId/responses`}
        component={NotActiveView}
      />
      <Route
        path={`${match.url}/:programId/:patientId/surveys/:surveyId/module/:moduleId`}
        component={NotActiveView}
      />
      <Route
        path={`${match.url}/:programId/:patientId/surveys/module/:moduleId`}
        component={NotActiveView}
      />
      <Route
        path={`${match.url}/:programId/:patientId/surveys/:surveyId`}
        component={NotActiveView}
      />
      <Route path={`${match.url}/:programId/:patientId/surveys`} component={NotActiveView} />
      <Route path={`${match.url}/:programId/patients`} component={NotActiveView} />
    </Switch>
  );
});
