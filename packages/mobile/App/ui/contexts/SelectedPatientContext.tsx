import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import type { Patient } from '~/models/Patient';
import { readConfig, writeConfig } from '~/services/config';
import type { IPatient } from '~/types';
import { createStoredState, type StoredState } from '~/ui/helpers/storedState';
import { patientListKeys } from '~/ui/hooks/queries/queryKeys';
import { useStoredState } from '~/ui/hooks/useStoredState';
import queryClient from '~/ui/queryClient';

interface SelectedPatientState {
  selectedPatient: IPatient | null;
}

export interface SelectedPatientContextData extends SelectedPatientState {
  /**
   * Selects a patient, or clears the selection when given null.
   *
   * Takes the `Patient` model as well as `IPatient` because the model, which is meant to
   * implement the interface, is not assignable to it: the two disagree on the type of
   * `village.visibilityStatus`.
   */
  setSelectedPatient: (patient: IPatient | Patient | null) => void;
}

const initialState: SelectedPatientState = { selectedPatient: null };

// The key redux-persist kept the Redux state under, kept so that an app update finds the
// selection an earlier build stored
const rootStore = createStoredState<SelectedPatientState & { patient?: SelectedPatientState }>(
  AsyncStorage,
  'persist:root',
);

const selectedPatientStore: StoredState<SelectedPatientState> = {
  async read() {
    const stored = await rootStore.read();
    // Those earlier builds stored the whole Redux state, with the selection inside its
    // patient slice
    return stored?.patient ?? stored;
  },
  write: rootStore.write,
};

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

const SelectedPatientContext = createContext<SelectedPatientContextData>(
  {} as SelectedPatientContextData,
);

export const SelectedPatientProvider = ({ children }: PropsWithChildren) => {
  const [{ selectedPatient }, setState, isRestored] = useStoredState(
    selectedPatientStore,
    initialState,
  );

  const setSelectedPatient = useCallback(
    (patient: IPatient | Patient | null): void => {
      if (patient?.id) addPatientToRecentlyViewed(patient.id);
      setState({ selectedPatient: patient as IPatient });
    },
    [setState],
  );

  const value = useMemo(
    (): SelectedPatientContextData => ({ selectedPatient, setSelectedPatient }),
    [selectedPatient, setSelectedPatient],
  );

  // The Patient tab shows search or the patient's home depending on the selection, so
  // nothing below renders until the stored one has been read
  if (!isRestored) return null;

  return (
    <SelectedPatientContext.Provider value={value}>{children}</SelectedPatientContext.Provider>
  );
};

export const useSelectedPatient = (): SelectedPatientContextData =>
  useContext(SelectedPatientContext);
