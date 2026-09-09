import type { Dispatch } from 'redux';
import type { PatientStateProps } from '/store/ducks/patient';
import type { AuthStateProps } from '../store/ducks/auth';

export interface ReduxStoreProps {
  dispatch: Dispatch;
  patient: PatientStateProps;
  auth: AuthStateProps;
}
