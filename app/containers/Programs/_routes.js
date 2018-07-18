import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Pregnancy from './Pregnancy/Pregnancy';
import Prepregnancies from './Pregnancy/Prepregnancies';
import EditVisit from './Pregnancy/EditVisit';
import PregnancyConfirm from './Pregnancy/PregnancyConfirm';
import QuestionTable from './Pregnancy/QuestionTable';
import QuestionsFirst from './Pregnancy/QuestionsFirst';
import QuestionsSecond from './Pregnancy/QuestionsSecond';
import QuestionsThird from './Pregnancy/QuestionsThird';
import PatientListing from '../Patients/PatientListing';
import Patients from './Patients';
import Surveys from './Surveys';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Pregnancy} />
        <Route path={`${url}/:programId/patients`} component={Patients} />
        <Route path={`${url}/:programId/:patientId/surveys`} component={Surveys} />
        {/* <Route path={`${url}/:programId/:patientId/surveys/:survey/`} component={PatientListing} /> */}
        {/* <Route path={`${url}/pregnancies`} component={PatientListing} /> */}
        {/* <Route path={`${url}/prepregnancies`} component={Prepregnancies} /> */}
        <Route path={`${url}/pregnancyVisit`} component={EditVisit} />
        <Route path={`${url}/pregnancyConfirm`} component={PregnancyConfirm} />
        <Route path={`${url}/questionTable`} component={QuestionTable} />
        <Route path={`${url}/questionsFirst`} component={QuestionsFirst} />
        <Route path={`${url}/questionsSecond`} component={QuestionsSecond} />
        <Route path={`${url}/questionsThird`} component={QuestionsThird} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
