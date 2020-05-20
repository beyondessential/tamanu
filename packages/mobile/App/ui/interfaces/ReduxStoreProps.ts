import { Dispatch } from 'redux';
import { PatientStateProps } from '/store/ducks/patient';
import { AuthStateProps } from '../store/ducks/auth';

export interface ReduxStoreProps {
  dispatch: Dispatch;
  patient: PatientStateProps;
  auth: AuthStateProps;
}
