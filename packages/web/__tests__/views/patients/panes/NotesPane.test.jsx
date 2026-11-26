import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';

import { createQueryClient } from '../../../helpers';
import { NotesPane } from '../../../../app/views/patients/panes/NotesPane';

vi.mock('../../../../app/components/NoteTable', () => ({
  NoteTableWithPermission: ({ refreshCount }) => <output>{refreshCount}</output>,
}));

vi.mock('../../../../app/components/SearchBar', () => ({
  NotesSearchBar: () => null,
}));

vi.mock('../../../../app/contexts/NoteModal', () => ({
  useNoteModal: () => ({ openNoteModal: vi.fn(), updateNoteModalProps: vi.fn() }),
}));

const ENCOUNTER_QUERY_KEY = ['encounter', 'encounter-1'];

const renderNotesPaneForServerEncounter = initialServerEncounter => {
  let serverEncounter = initialServerEncounter;
  const queryClient = createQueryClient();

  const EncounterNotes = () => {
    // Each fetch returns a fresh copy, as a real response would.
    const { data: encounter } = useQuery(ENCOUNTER_QUERY_KEY, () =>
      structuredClone(serverEncounter),
    );
    return encounter ? <NotesPane encounter={encounter} /> : null;
  };

  render(
    <QueryClientProvider client={queryClient}>
      <EncounterNotes />
    </QueryClientProvider>,
  );

  return {
    refetchEncounter: async nextServerEncounter => {
      serverEncounter = nextServerEncounter;
      await act(async () => {
        await queryClient.refetchQueries(ENCOUNTER_QUERY_KEY);
        // React Query hands the result to its observers a tick later, so let that render land.
        await new Promise(resolve => {
          setTimeout(resolve, 0);
        });
      });
    },
  };
};

const getRefreshCount = () => Number(screen.getByRole('status').textContent);

const admission = {
  id: 'encounter-1',
  encounterType: 'admission',
  updatedAt: '2026-11-13T01:00:00.000Z',
  diets: [{ id: 'diet-diabetic', name: 'Diabetic diet' }],
};

describe('NotesPane', () => {
  it('refetches its notes when an edit changes only the encounter diets', async () => {
    const { refetchEncounter } = renderNotesPaneForServerEncounter(admission);
    await screen.findByRole('status');
    expect(getRefreshCount()).toBe(0);

    await refetchEncounter({
      ...admission,
      diets: [...admission.diets, { id: 'diet-cardiac', name: 'Cardiac diet' }],
    });

    expect(getRefreshCount()).toBe(1);
  });

  it('refetches its notes when the encounter row changes', async () => {
    const { refetchEncounter } = renderNotesPaneForServerEncounter(admission);
    await screen.findByRole('status');
    expect(getRefreshCount()).toBe(0);

    await refetchEncounter({ ...admission, updatedAt: '2026-11-13T02:00:00.000Z' });

    expect(getRefreshCount()).toBe(1);
  });

  it('keeps its notes when a refetch returns the same encounter', async () => {
    const { refetchEncounter } = renderNotesPaneForServerEncounter(admission);
    await screen.findByRole('status');
    expect(getRefreshCount()).toBe(0);

    await refetchEncounter(admission);

    expect(getRefreshCount()).toBe(0);
  });
});
