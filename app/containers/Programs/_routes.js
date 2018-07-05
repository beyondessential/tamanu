import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import Programs from './Programs';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Programs} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
