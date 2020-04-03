import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';
import { SurveyView } from '../views/programs/ProgramsView';

const DUMMY_SURVEY = {
  screens: [
    {
      questions: [
        { text: "Test question 1", type: 'text', _id: '123' },
        { text: "Test question 2", type: 'number', _id: '202' },
      ]
    },
    {
      questions: [
        { text: "Test question 3", type: 'text', _id: '4040' },
        { text: "Test question 4", type: 'number', _id: '2020' },
      ]
    }
  ],
};

export const ProgramsRoutes = React.memo(({ match }) => {
  return (
    <SurveyView survey={DUMMY_SURVEY} />
    /*
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
    */
  );
});
