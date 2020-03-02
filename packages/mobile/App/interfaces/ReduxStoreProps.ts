import { Dispatch } from 'redux';
import { PatientStateProps } from '../redux/ducks/patient';

export interface ReduxStoreProps {
    dispatch: Dispatch;
    patient: PatientStateProps,
}
