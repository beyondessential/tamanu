import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Pregnancy from './Pregnancy';
import EditVisit from './EditVisit';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Pregnancy} />
        <Route path={`${url}/pregnancyVisit/:id`} component={EditVisit} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
