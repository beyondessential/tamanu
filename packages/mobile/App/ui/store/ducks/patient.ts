import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { readConfig, writeConfig } from '~/services/config';
import { IPatient } from '~/types';

export type WithPatientStoreProps = WithPatientActions & PatientStateProps;
export interface WithPatientActions {
  setSelectedPatient: (
    payload: IPatient | null,
  ) => PayloadAction<IPatient>;
}

export interface PatientStateProps {
  selectedPatient: IPatient;
}

const MAX_STORED_RECENT_PATIENTS = 20;

const addPatientToRecentlyViewed = async (patientId: string): Promise<void> => {
  const oldRecentlyViewedPatients: string[] = JSON.parse(await readConfig('recentlyViewedPatients', '[]'));

  const updatedArray = [
    patientId,
    ...oldRecentlyViewedPatients.filter((id) => id !== patientId),
  ].slice(0, MAX_STORED_RECENT_PATIENTS);

  writeConfig('recentlyViewedPatients', JSON.stringify(updatedArray));
};

const initialState: PatientStateProps = {
  selectedPatient: null,
};

export const PatientSlice = createSlice({
  name: 'patient',
  initialState: initialState,
  reducers: {
    setSelectedPatient(
      state,
      { payload: patient }: PayloadAction<IPatient>,
    ): PatientStateProps {
      if (patient?.id) addPatientToRecentlyViewed(patient.id);

      return {
        selectedPatient: patient,
      };
    },
  },
});

export const actions = PatientSlice.actions;
export const patientReducer = PatientSlice.reducer;
