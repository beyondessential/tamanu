import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { IPatient } from '~/types';
import { patientListKeys } from '~/ui/hooks/queries/queryKeys';
import queryClient from '~/ui/queryClient';
import {
  preloadSelectedPatient,
  SelectedPatientProvider,
  useSelectedPatient,
} from './SelectedPatientContext';

jest.mock('~/ui/queryClient', () => ({
  __esModule: true,
  default: { invalidateQueries: jest.fn() },
}));

jest.useRealTimers();

const mockInvalidateQueries = queryClient.invalidateQueries as jest.Mock;

const STORAGE_KEY = 'selectedPatient';
const RECENTLY_VIEWED_KEY = 'recentlyViewedPatients';

const mele = { id: 'patient-1', firstName: 'Mele', lastName: 'Tuala' } as IPatient;
const sione = { id: 'patient-2', firstName: 'Sione', lastName: 'Fonoti' } as IPatient;

const renderSelectedPatientHook = () =>
  renderHook(() => useSelectedPatient(), { wrapper: SelectedPatientProvider });

const renderSelectedPatient = async () => {
  const { result } = await renderSelectedPatientHook();
  // The provider renders nothing until it has read the stored selection
  await waitFor(() => expect(result.current).not.toBeNull());
  return result;
};

/** Lets a write that has been started reach storage, so its absence means something */
const flushStorage = () =>
  act(
    () =>
      new Promise<void>(resolve => {
        setTimeout(resolve, 0);
      }),
  );

const storedSelection = async () => JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
const recentlyViewed = async () => JSON.parse(await AsyncStorage.getItem(RECENTLY_VIEWED_KEY));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('SelectedPatientProvider', () => {
  describe('opening the app', () => {
    it('starts with no patient selected when nothing is stored', async () => {
      const result = await renderSelectedPatient();

      expect(result.current.selectedPatient).toBeNull();
    });

    it('holds everything back until the stored selection has been read', async () => {
      let finishReading: (stored: string) => void;
      const getItem = jest.spyOn(AsyncStorage, 'getItem').mockReturnValueOnce(
        new Promise(resolve => {
          finishReading = resolve;
        }),
      );
      const setItem = jest.spyOn(AsyncStorage, 'setItem');

      const { result } = await renderSelectedPatientHook();
      await flushStorage();

      expect(result.current).toBeNull();
      expect(setItem).not.toHaveBeenCalled();

      await act(async () => finishReading(JSON.stringify({ selectedPatient: mele })));

      expect(result.current.selectedPatient).toEqual(mele);
      getItem.mockRestore();
      setItem.mockRestore();
    });

    it('picks up a selection that was read before it mounted', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedPatient: mele }));
      preloadSelectedPatient();
      // Nothing is stored after this, so the selection can only have come from the earlier read
      await AsyncStorage.clear();

      const result = await renderSelectedPatient();

      expect(result.current.selectedPatient).toEqual(mele);
    });

    it('restores a stored selection', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedPatient: mele }));

      const result = await renderSelectedPatient();

      expect(result.current.selectedPatient).toEqual(mele);
    });

    it('restores an empty selection', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedPatient: null }));

      const result = await renderSelectedPatient();

      expect(result.current.selectedPatient).toBeNull();
    });

    it('leaves a stored selection it cannot read as it is', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, '{"selectedPatient":');

      const result = await renderSelectedPatient();
      await flushStorage();

      expect(result.current.selectedPatient).toBeNull();
      expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('{"selectedPatient":');
    });

    it('does not count a restored selection as viewed again', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedPatient: mele }));

      await renderSelectedPatient();

      expect(await recentlyViewed()).toBeNull();
    });
  });

  describe('selecting a patient', () => {
    it('selects the patient and stores the selection', async () => {
      const result = await renderSelectedPatient();

      await act(async () => result.current.setSelectedPatient(mele));

      expect(result.current.selectedPatient).toEqual(mele);
      await waitFor(async () => expect(await storedSelection()).toEqual({ selectedPatient: mele }));
    });

    it('replaces whichever patient was selected before', async () => {
      const result = await renderSelectedPatient();

      await act(async () => result.current.setSelectedPatient(mele));
      await act(async () => result.current.setSelectedPatient(sione));

      expect(result.current.selectedPatient).toEqual(sione);
      await waitFor(async () =>
        expect(await storedSelection()).toEqual({ selectedPatient: sione }),
      );
    });

    it('clears the selection and stores that it is empty', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedPatient: mele }));
      const result = await renderSelectedPatient();

      await act(async () => result.current.setSelectedPatient(null));

      expect(result.current.selectedPatient).toBeNull();
      await waitFor(async () => expect(await storedSelection()).toEqual({ selectedPatient: null }));
    });

    it('keeps the same setter between renders', async () => {
      const result = await renderSelectedPatient();
      const { setSelectedPatient } = result.current;

      await act(async () => result.current.setSelectedPatient(mele));

      expect(result.current.setSelectedPatient).toBe(setSelectedPatient);
    });
  });

  describe('recently viewed', () => {
    it('puts a selected patient at the top of the list and refreshes it', async () => {
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([sione.id]));
      const result = await renderSelectedPatient();

      await act(async () => result.current.setSelectedPatient(mele));

      await waitFor(async () => expect(await recentlyViewed()).toEqual([mele.id, sione.id]));
      await waitFor(() =>
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: patientListKeys.recentlyViewed(),
        }),
      );
    });

    it('moves a patient already in the list to the top', async () => {
      await AsyncStorage.setItem(
        RECENTLY_VIEWED_KEY,
        JSON.stringify([sione.id, 'patient-3', mele.id]),
      );
      const result = await renderSelectedPatient();

      await act(async () => result.current.setSelectedPatient(mele));

      await waitFor(async () =>
        expect(await recentlyViewed()).toEqual([mele.id, sione.id, 'patient-3']),
      );
    });

    it('keeps the 20 most recently selected patients', async () => {
      const twentyPatientIds = Array.from({ length: 20 }, (_, index) => `earlier-${index}`);
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(twentyPatientIds));
      const result = await renderSelectedPatient();

      await act(async () => result.current.setSelectedPatient(mele));

      await waitFor(async () =>
        expect(await recentlyViewed()).toEqual([mele.id, ...twentyPatientIds.slice(0, 19)]),
      );
    });

    it('leaves the list alone when the patient is already at the top', async () => {
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([mele.id, sione.id]));
      const result = await renderSelectedPatient();

      await act(async () => result.current.setSelectedPatient(mele));
      await waitFor(async () => expect(await storedSelection()).toEqual({ selectedPatient: mele }));

      expect(await recentlyViewed()).toEqual([mele.id, sione.id]);
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it('leaves the list alone when the selection is cleared', async () => {
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([mele.id]));
      const result = await renderSelectedPatient();

      await act(async () => result.current.setSelectedPatient(null));
      await waitFor(async () => expect(await storedSelection()).toEqual({ selectedPatient: null }));

      expect(await recentlyViewed()).toEqual([mele.id]);
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });
});
