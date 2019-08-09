import React from 'react';
import { ApiContext } from './singletons';

export const connectApi = mapApiToProps => WrappedComponent => ownProps => (
  <ApiContext.Consumer>
    {api => {
      const apiProps = mapApiToProps(api, ownProps);
      return <WrappedComponent {...apiProps} {...ownProps} />;
    }}
  </ApiContext.Consumer>
);
