import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Pregnancy from './Pregnancy';
import EditVisit from './EditVisit';
import PregnancyConfirm from './PregnancyConfirm';
import QuestionTable from './QuestionTable';
import QuestionsFirst from './QuestionsFirst';
import QuestionsSecond from './QuestionsSecond';
import QuestionsThird from './QuestionsThird';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Pregnancy} />
        <Route path={`${url}/pregnancyVisit/:id`} component={EditVisit} />
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
