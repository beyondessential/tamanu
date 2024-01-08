import React, { FC } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { actions, PatientStateProps } from '/store/ducks/patient';
import { ReduxStoreProps } from '../interfaces/ReduxStoreProps';
import { IPatient } from '~/types/IPatient';

export const withPatient = (WrappedComponent: FC<{selectedPatient: IPatient}>) => {
  const mapStateToProps = (state: ReduxStoreProps): PatientStateProps => ({
    ...state.patient,
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
