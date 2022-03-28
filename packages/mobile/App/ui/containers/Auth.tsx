import React, { FC } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { actions, AuthStateProps } from '/store/ducks/auth';
import { ReduxStoreProps } from '../interfaces/ReduxStoreProps';

export const withAuth = (WrappedComponent: FC<any>): FC<any> => {
  const mapStateToProps = (state: ReduxStoreProps): AuthStateProps => ({
    ...state.auth,
  });
  const mapDispatchToProps = (dispatch: Dispatch): any => ({
    dispatch,
    ...bindActionCreators(actions, dispatch),
  });
  const Wrapper = (props: any): React.ReactElement => (
    <WrappedComponent {...props} />
  );
  return connect(mapStateToProps, mapDispatchToProps)(Wrapper);
};
