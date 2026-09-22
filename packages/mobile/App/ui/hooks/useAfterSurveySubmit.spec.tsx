import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import React, { type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Patient } from '~/models/Patient';
import type { IPatient } from '~/types';
import type { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { actions } from '~/ui/store/ducks/patient';
import {
  patientKeys,
  patientListKeys,
  registrationKeys,
  reportKeys,
  surveyKeys,
} from './queries/queryKeys';
import { invalidateAfterSurveySubmit, useAfterSurveySubmit } from './useAfterSurveySubmit';

jest.mock('~/models/Patient', () => ({
  Patient: { findOne: jest.fn() },
}));

// The patient duck imports these for its recently-viewed side effect; not exercised here
jest.mock('~/services/config', () => ({
  readConfig: jest.fn(),
  writeConfig: jest.fn(),
}));
jest.mock('~/ui/queryClient', () => ({
  __esModule: true,
  default: { invalidateQueries: jest.fn() },
}));

// react-redux resolves a second copy of React under jest, so its Provider cannot be rendered
// alongside the test renderer; stub the hooks instead.
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// TanStack Query resolves queries via timers that the globally enabled fake timers would stall
jest.useRealTimers();

const mockFindOne = Patient.findOne as jest.Mock;
const mockUseDispatch = useDispatch as unknown as jest.Mock;
const mockUseSelector = useSelector as unknown as jest.Mock;
const mockDispatch = jest.fn();

const PATIENT_ID = 'patient-1';
const selectedPatient = { id: PATIENT_ID, firstName: 'Old' } as IPatient;

// gcTime: 0 so no garbage-collection timers outlive the tests and keep jest from exiting
const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

const renderAfterSurveySubmit = async () => {
  const queryClient = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useAfterSurveySubmit(), { wrapper });
  return result.current;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDispatch.mockReturnValue(mockDispatch);
  mockUseSelector.mockImplementation((selector: (state: ReduxStoreProps) => unknown) =>
    selector({ patient: { selectedPatient } } as ReduxStoreProps),
  );
});

describe('invalidateAfterSurveySubmit', () => {
  it('invalidates every query a submission can make stale and leaves others alone', () => {
    const queryClient = createQueryClient();
    const staleKeys = [
      patientKeys.detail(PATIENT_ID),
      patientKeys.additionalData(PATIENT_ID),
      [...patientKeys.registrations(PATIENT_ID), 'recent', {}],
      patientListKeys.recentlyViewed(),
      patientListKeys.search({ search: '', filters: {} }),
      registrationKeys.detail('registration-1'),
      reportKeys.referralList(),
    ];
    const untouchedKeys = [patientKeys.detail('patient-2'), surveyKeys.vitalsSurvey()];
    for (const key of [...staleKeys, ...untouchedKeys]) {
      queryClient.setQueryData(key, {});
    }

    invalidateAfterSurveySubmit(queryClient, PATIENT_ID);

    for (const key of staleKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    for (const key of untouchedKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }
  });
});

describe('useAfterSurveySubmit', () => {
  it('reloads the selected patient into the store', async () => {
    const reloadedPatient = { ...selectedPatient, firstName: 'New' };
    mockFindOne.mockResolvedValue(reloadedPatient);
    const afterSurveySubmit = await renderAfterSurveySubmit();

    await act(() => afterSurveySubmit(PATIENT_ID));

    expect(mockFindOne).toHaveBeenCalledWith({ where: { id: PATIENT_ID } });
    expect(mockDispatch).toHaveBeenCalledWith(actions.setSelectedPatient(reloadedPatient));
  });

  it('does not touch the store when a different patient is selected', async () => {
    const afterSurveySubmit = await renderAfterSurveySubmit();

    await act(() => afterSurveySubmit('patient-2'));

    expect(mockFindOne).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not touch the store when the patient can no longer be found', async () => {
    mockFindOne.mockResolvedValue(null);
    const afterSurveySubmit = await renderAfterSurveySubmit();

    await act(() => afterSurveySubmit(PATIENT_ID));

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
