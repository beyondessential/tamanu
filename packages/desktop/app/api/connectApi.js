import React from 'react';
import { connect } from 'react-redux';
import { ApiContext } from './ApiContext';

export const connectApi = mapApiToProps => WrappedComponent =>
  connect(dispatch => ({ dispatch }))(({ dispatch, ...ownProps }) => (
    <ApiContext.Consumer>
      {api => {
        const apiProps = mapApiToProps(api, dispatch, ownProps);
        return <WrappedComponent {...apiProps} {...ownProps} />;
      }}
    </ApiContext.Consumer>
  ));
