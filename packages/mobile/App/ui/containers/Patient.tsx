import React, { type FC } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, type Dispatch } from 'redux';
import { actions, type PatientStateProps } from '/store/ducks/patient';
import type { ReduxStoreProps } from '../interfaces/ReduxStoreProps';
import type { IPatient } from '~/types/IPatient';

export const withPatient = (WrappedComponent: FC<{ selectedPatient: IPatient }>) => {
  const mapStateToProps = (state: ReduxStoreProps): PatientStateProps => ({
    ...state.patient,
  });

  const mapDispatchToProps = (dispatch: Dispatch): any => ({
    dispatch,
    ...bindActionCreators(actions, dispatch),
  });
  const Wrapper = (props: any): React.ReactElement => <WrappedComponent {...props} />;
  return connect(mapStateToProps, mapDispatchToProps)(Wrapper);
};
