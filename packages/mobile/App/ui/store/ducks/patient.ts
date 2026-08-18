import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { readConfig, writeConfig } from '~/services/config';
import type { IPatient } from '~/types';
import queryClient from '~/ui/queryClient';
import { patientListKeys } from '~/ui/hooks/queries/queryKeys';

export type WithPatientStoreProps = WithPatientActions & PatientStateProps;
export interface WithPatientActions {
  setSelectedPatient: (payload: IPatient | null) => PayloadAction<IPatient>;
}

export interface PatientStateProps {
  selectedPatient: IPatient;
}

const MAX_STORED_RECENT_PATIENTS = 20;

const addPatientToRecentlyViewed = async (patientId: string): Promise<void> => {
  const prev: string[] = JSON.parse(await readConfig('recentlyViewedPatients', '[]'));

  if (prev[0] === patientId) return;

  const updatedArray = [patientId, ...prev.filter(id => id !== patientId)].slice(
    0,
    MAX_STORED_RECENT_PATIENTS,
  );

  await writeConfig('recentlyViewedPatients', JSON.stringify(updatedArray));

  queryClient.invalidateQueries({ queryKey: patientListKeys.recentlyViewed() });
};

const initialState: PatientStateProps = {
  selectedPatient: null,
};

export const PatientSlice = createSlice({
  name: 'patient',
  initialState: initialState,
  reducers: {
    setSelectedPatient(state, { payload: patient }: PayloadAction<IPatient>): PatientStateProps {
      if (patient?.id) addPatientToRecentlyViewed(patient.id);

      return {
        selectedPatient: patient,
      };
    },
  },
});

export const actions = PatientSlice.actions;
export const patientReducer = PatientSlice.reducer;
