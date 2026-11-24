import type { Dispatch } from 'redux';
import type { PatientStateProps } from '/store/ducks/patient';

export interface ReduxStoreProps {
  dispatch: Dispatch;
  patient: PatientStateProps;
}
