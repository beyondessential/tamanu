// Regression test for the encounter loading state (W11).

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';

import { createQueryClient } from '../helpers/render';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../app/api', async () => {
  const actual = await vi.importActual('../../app/api');
  return {
    ...actual,
    useApi: () => ({
      get: mockGet,
      post: mockPost,
    }),
  };
});

import { EncounterProvider, useEncounter } from '../../app/contexts/Encounter';

const LoadEncounterProbe = () => {
  const { isLoadingEncounter, loadEncounter, createEncounter } = useEncounter();
  return (
    <div>
      <span data-testid="loading-state">{isLoadingEncounter ? 'loading' : 'idle'}</span>
      <button type="button" onClick={() => loadEncounter('test-encounter-id').catch(() => {})}>
        load
      </button>
      <button type="button" onClick={() => createEncounter({}).catch(() => {})}>
        create
      </button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <EncounterProvider>
        <LoadEncounterProbe />
      </EncounterProvider>
    </QueryClientProvider>,
  );

describe('EncounterProvider loading state', () => {
  it('clears isLoadingEncounter after a failed loadEncounter fetch', async () => {
    mockGet.mockRejectedValueOnce(new Error('network error'));
    renderWithProvider();

    await userEvent.click(screen.getByText('load'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('idle');
    });
  });

  it('clears isLoadingEncounter after a failed createEncounter fetch', async () => {
    mockPost.mockRejectedValueOnce(new Error('network error'));
    renderWithProvider();

    await userEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('idle');
    });
  });

  it('clears isLoadingEncounter when the post succeeds but the follow-up load fails', async () => {
    mockPost.mockResolvedValueOnce({ id: 'test-encounter-id' });
    mockGet.mockRejectedValueOnce(new Error('network error'));
    renderWithProvider();

    await userEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('idle');
    });
  });
});
