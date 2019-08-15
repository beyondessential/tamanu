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

export const APIForm = connectApi(api => ({ api }))(
  ({ api, form, endpoint, extraParams, ...otherProps }) => {
    const onSubmit = data => api.post(endpoint, { ...extraParams, ...data });
    return React.createElement(form, { ...otherProps, onSubmit });
  },
);
