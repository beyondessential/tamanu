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

// This is strictly more useful than connectApi and represents a negligible
// performance hit. Should refactor the app to always use this using some 
// free time.
export const connectApiAndState = mapApiToProps => WrappedComponent => 
  connect(
    state => ({ state }),
    dispatch => ({ dispatch }),
  )(({ dispatch, state, ...ownProps }) => (
    <ApiContext.Consumer>
      {api => {
        const apiProps = mapApiToProps(api, state, dispatch, ownProps);
        return <WrappedComponent {...apiProps} {...ownProps} />;
      }}
    </ApiContext.Consumer>
  ));
