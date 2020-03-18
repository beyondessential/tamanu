import { Dispatch } from 'redux';
import { PatientStateProps } from '/store/ducks/patient';

export interface ReduxStoreProps {
    dispatch: Dispatch;
    patient: PatientStateProps,
}
