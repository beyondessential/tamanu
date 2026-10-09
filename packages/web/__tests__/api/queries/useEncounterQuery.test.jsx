// The encounter's query key is a prefix of every key `useGraphDataQuery` builds, so a partial
// invalidation would refetch every vitals and chart graph on the encounter each time a diagnosis,
// procedure, chart or medication is saved.

import * as React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';

import { createQueryClient } from '../../helpers/render';
import {
  ENCOUNTER_QUERY_KEY,
  useInvalidateEncounter,
} from '../../../app/api/queries/useEncounterQuery';

const ENCOUNTER_ID = 'encounter-1';
const GRAPH_KEY = [ENCOUNTER_QUERY_KEY, ENCOUNTER_ID, 'graphData', 'vitals', 'element-1'];

describe('useInvalidateEncounter', () => {
  it('invalidates the encounter without touching queries nested under its key', async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData([ENCOUNTER_QUERY_KEY, ENCOUNTER_ID], { id: ENCOUNTER_ID });
    queryClient.setQueryData(GRAPH_KEY, []);

    const { result } = renderHook(() => useInvalidateEncounter(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await result.current(ENCOUNTER_ID);

    expect(queryClient.getQueryState([ENCOUNTER_QUERY_KEY, ENCOUNTER_ID]).isInvalidated).toBe(true);
    expect(queryClient.getQueryState(GRAPH_KEY).isInvalidated).toBe(false);
  });
});
