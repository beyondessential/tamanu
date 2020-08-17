import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IPatient } from '~/types';

export type WithPatientStoreProps = WithPatientActions & PatientStateProps;
export interface WithPatientActions {
  setSelectedPatient: (
    payload: IPatient | null,
  ) => PayloadAction<IPatient>;
}

export interface PatientStateProps {
  selectedPatient: any;
  selectedPatientList: IPatient[];
}

const initialState: PatientStateProps = {
  selectedPatient: null,
  selectedPatientList: [],
};

export const PatientSlice = createSlice({
  name: 'patient',
  initialState: initialState,
  reducers: {
    setSelectedPatient(
      state,
      { payload: patient }: PayloadAction<IPatient>,
    ): PatientStateProps {
      const newSelectedPatientList = state.selectedPatientList.filter(
        patientData => patient.id === patientData.id,
      );
      newSelectedPatientList.unshift();
      return {
        selectedPatient: patient,
        selectedPatientList: newSelectedPatientList,
      };
    },
  },
});

export const actions = PatientSlice.actions;
export const patientReducer = PatientSlice.reducer;
