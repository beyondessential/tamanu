import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Pregnancy from './Pregnancy';
import EditVisit from './EditVisit';
import PregnancyConfirm from './PregnancyConfirm';
import QuestionTable from './QuestionTable';


export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Pregnancy} />
        <Route path={`${url}/pregnancyVisit/:id`} component={EditVisit} />
        <Route path={`${url}/pregnancyConfirm`} component={PregnancyConfirm} />
        <Route path={`${url}/questionTable`} component={QuestionTable} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
