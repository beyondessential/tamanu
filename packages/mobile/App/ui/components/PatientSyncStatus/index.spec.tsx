import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import React from 'react';
import type { IPatient } from '~/types';
import { useAuth } from '~/ui/contexts/AuthContext';
import usePatientIsMarkedForSyncQuery from '~/ui/hooks/queries/usePatientIsMarkedForSyncQuery';
import { PatientSyncStatus } from './index';

jest.mock('~/ui/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('~/ui/hooks/queries/usePatientIsMarkedForSyncQuery', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('~/ui/hooks', () => ({ useBackend: () => ({ syncManager: {} }) }));
jest.mock('~/ui/contexts/TranslationContext', () => ({
  useTranslation: () => ({ getTranslation: (_id: string, fallback: string) => fallback }),
}));
jest.mock('~/infra/db', () => ({
  Database: { models: { LocalSystemFact: { findOne: jest.fn(async () => null) } } },
}));
jest.mock('~/models/Patient', () => ({ Patient: { markForSync: jest.fn() } }));
jest.mock('~/services/sync', () => ({ LAST_SUCCESSFUL_PULL: 'lastSuccessfulPull' }));
jest.mock('./SyncStatusIcon', () => ({
  SyncStatusIcon: ({ isMarkedForSync }: { isMarkedForSync: boolean }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText>{isMarkedForSync ? 'marked-for-sync' : 'not-marked-for-sync'}</MockText>;
  },
}));

// TanStack Query resolves queries via timers that the globally enabled fake timers would stall
jest.useRealTimers();

const mockUseAuth = useAuth as jest.Mock;
const mockUseIsMarkedForSync = usePatientIsMarkedForSyncQuery as jest.Mock;

const selectedPatient = { id: 'patient-1' } as IPatient;

// gcTime: 0 so no garbage-collection timers outlive the tests and keep jest from exiting
const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

const renderStatus = async ({
  isMarkedForSync,
  canSyncPatient,
}: {
  isMarkedForSync: boolean;
  canSyncPatient: boolean;
}) => {
  mockUseIsMarkedForSync.mockReturnValue({ data: isMarkedForSync, isPending: false });
  mockUseAuth.mockReturnValue({
    ability: { can: (_verb: string, noun: string) => noun !== 'SyncPatient' || canSyncPatient },
  });
  return await render(
    <QueryClientProvider client={createQueryClient()}>
      <PatientSyncStatus selectedPatient={selectedPatient} />
    </QueryClientProvider>,
  );
};

describe('PatientSyncStatus', () => {
  it('offers to sync an unsynced patient to a user with create SyncPatient', async () => {
    const { getByText } = await renderStatus({ isMarkedForSync: false, canSyncPatient: true });

    expect(getByText('not-marked-for-sync')).toBeTruthy();
  });

  it('shows no sync status for an unsynced patient to a user without create SyncPatient', async () => {
    const { queryByText } = await renderStatus({ isMarkedForSync: false, canSyncPatient: false });

    expect(queryByText('not-marked-for-sync')).toBeNull();
    expect(queryByText('marked-for-sync')).toBeNull();
  });

  it('shows the synced status to a user without create SyncPatient', async () => {
    const { getByText } = await renderStatus({ isMarkedForSync: true, canSyncPatient: false });

    expect(getByText('marked-for-sync')).toBeTruthy();
  });
});
