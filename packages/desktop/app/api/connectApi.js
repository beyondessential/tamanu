import React from 'react';
import { ApiContext } from './singletons';

export function connectApi(mapApiToProps) {
  function connectFunc(WrappedComponent) {
    return ownProps => (
      <ApiContext.Consumer>
        {api => {
          const apiProps = mapApiToProps(api);
          return <WrappedComponent {...apiProps} {...ownProps} />;
        }}
      </ApiContext.Consumer>
    );
  }
  return connectFunc;
}
