import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PatientModel } from '../../models/Patient';

export type WithPatientStoreProps = WithPatientActions & PatientStateProps
export interface WithPatientActions {
  setSelectedPatient: (payload: PatientModel|null) => PayloadAction<PatientModel>
}

export interface PatientStateProps {
  selectedPatient: any,
  selectedPatientList: PatientModel[]
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
      state, { payload: patient }: PayloadAction<PatientModel>,
    ): PatientStateProps {
      const newSelectedPatientList = state.selectedPatientList
        .filter((patientData) => patient.id === patientData.id);
      newSelectedPatientList.unshift();
      return {
        selectedPatient: patient,
        selectedPatientList: newSelectedPatientList,
      };
    },
  },
});

export const actions = PatientSlice.actions;
export const reducer = PatientSlice.reducer;
