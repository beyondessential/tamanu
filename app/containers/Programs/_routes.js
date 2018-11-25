import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import PatientListing from '../Patients/PatientListing';
import Patients from './Patients';
import Surveys from './Surveys';
import Survey from './Survey';
import Responses from './Responses';
import Response from './Response';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Patients} />
        <Route path={`${url}/:programId/:patientId/:surveyId/responses/:responseId`} component={Response} />
        <Route path={`${url}/:programId/:patientId/:surveyId/:moduleId/responses`} component={Responses} />
        <Route path={`${url}/:programId/:patientId/:surveyId/responses`} component={Responses} />
        <Route path={`${url}/:programId/:patientId/surveys/:surveyId/module/:moduleId`} component={Survey} />
        <Route path={`${url}/:programId/:patientId/surveys/module/:moduleId`} component={Surveys} />
        <Route path={`${url}/:programId/:patientId/surveys/:surveyId`} component={Survey} />
        <Route path={`${url}/:programId/:patientId/surveys`} component={Surveys} />
        <Route path={`${url}/:programId/patients`} component={Patients} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
