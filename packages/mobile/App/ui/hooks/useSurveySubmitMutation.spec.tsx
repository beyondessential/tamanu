import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import React, { type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Patient } from '~/models/Patient';
import { type IPatient, SurveyTypes } from '~/types';
import { useBackend } from '~/ui/hooks';
import type { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { actions } from '~/ui/store/ducks/patient';
import useSurveySubmitMutation, { type SubmitSurveyVariables } from './useSurveySubmitMutation';

jest.mock('~/models/Patient', () => ({
  Patient: { findOne: jest.fn() },
}));

jest.mock('~/ui/hooks', () => ({
  useBackend: jest.fn(),
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
const mockUseBackend = useBackend as jest.Mock;
const mockUseDispatch = useDispatch as unknown as jest.Mock;
const mockUseSelector = useSelector as unknown as jest.Mock;
const mockDispatch = jest.fn();
const mockSubmitSurveyResponse = jest.fn();
const mockSubmitReferral = jest.fn();

const PATIENT_ID = crypto.randomUUID();
const USER_ID = crypto.randomUUID();
const selectedPatient = { id: PATIENT_ID, firstName: 'Old' } as IPatient;
const submittedResponse = { id: 'response-1' };

const variables: SubmitSurveyVariables = {
  patientId: PATIENT_ID,
  surveyId: 'survey-1',
  surveyType: SurveyTypes.Programs,
  components: [],
  values: { 'question-1': 'answer' },
};

// gcTime: 0 so no garbage-collection timers outlive the tests and keep jest from exiting
const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

const renderSubmitSurvey = async () => {
  const queryClient = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useSurveySubmitMutation(), { wrapper });
  return result.current.mutateAsync;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseBackend.mockReturnValue({
    models: {
      SurveyResponse: { submit: mockSubmitSurveyResponse },
      Referral: { submit: mockSubmitReferral },
    },
  });
  mockSubmitSurveyResponse.mockResolvedValue(submittedResponse);
  mockSubmitReferral.mockResolvedValue(submittedResponse);
  mockFindOne.mockResolvedValue(selectedPatient);
  mockUseDispatch.mockReturnValue(mockDispatch);
  mockUseSelector.mockImplementation((selector: (state: ReduxStoreProps) => unknown) =>
    selector({
      patient: { selectedPatient },
      auth: { user: { id: USER_ID } },
    } as ReduxStoreProps),
  );
});

describe('useSurveySubmitMutation', () => {
  it('submits a survey response as the signed-in user', async () => {
    const submitSurvey = await renderSubmitSurvey();

    const response = await act(() => submitSurvey(variables));

    expect(response).toBe(submittedResponse);
    expect(mockSubmitSurveyResponse).toHaveBeenCalledWith(
      PATIENT_ID,
      USER_ID,
      {
        surveyId: variables.surveyId,
        components: variables.components,
        surveyType: SurveyTypes.Programs,
        encounterReason: 'Form response',
      },
      variables.values,
    );
    expect(mockSubmitReferral).not.toHaveBeenCalled();
  });

  it('submits a referral survey through the referral model', async () => {
    const submitSurvey = await renderSubmitSurvey();

    await act(() => submitSurvey({ ...variables, surveyType: SurveyTypes.Referral }));

    expect(mockSubmitReferral).toHaveBeenCalledTimes(1);
    expect(mockSubmitSurveyResponse).not.toHaveBeenCalled();
  });

  it('reloads the selected patient into the store after submitting', async () => {
    const reloadedPatient = { ...selectedPatient, firstName: 'New' };
    mockFindOne.mockResolvedValue(reloadedPatient);
    const submitSurvey = await renderSubmitSurvey();

    await act(() => submitSurvey(variables));

    expect(mockFindOne).toHaveBeenCalledWith({ where: { id: PATIENT_ID } });
    expect(mockDispatch).toHaveBeenCalledWith(actions.setSelectedPatient(reloadedPatient));
  });

  it('does not touch the store when the submission was not persisted', async () => {
    mockSubmitSurveyResponse.mockResolvedValue(null);
    const submitSurvey = await renderSubmitSurvey();

    await act(() => submitSurvey(variables));

    expect(mockFindOne).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not touch the store when a different patient is selected', async () => {
    const submitSurvey = await renderSubmitSurvey();

    await act(() => submitSurvey({ ...variables, patientId: 'patient-2' }));

    expect(mockFindOne).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not touch the store when the patient can no longer be found', async () => {
    mockFindOne.mockResolvedValue(null);
    const submitSurvey = await renderSubmitSurvey();

    await act(() => submitSurvey(variables));

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
