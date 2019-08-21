import React from 'react';
import { connect } from 'react-redux';
import { ApiContext } from './singletons';

export const connectApi = mapApiToProps => WrappedComponent =>
  connect(
    null,
    dispatch => ({ dispatch }),
  )(({ dispatch, ...ownProps }) => (
    <ApiContext.Consumer>
      {api => {
        const apiProps = mapApiToProps(api, dispatch, ownProps);
        return <WrappedComponent {...apiProps} {...ownProps} />;
      }}
    </ApiContext.Consumer>
  ));
