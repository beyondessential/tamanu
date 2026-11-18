import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { ApiContext } from '@tamanu/ui-components';

import { createQueryClient, renderElementWithTranslatedText } from '../../helpers';
import { DeletePhotoLinkModal } from '../../../app/views/patients/components/DeletePhotoLinkModal';

// The modal is reachable from the program registry charts screen, where there is no encounter, and
// was mounted by survey views outside the patient routes, where there is no EncounterProvider. It
// must render and delete without either.
const renderModal = () => {
  const api = { put: vi.fn(() => Promise.resolve({})) };
  const queryClient = createQueryClient();
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const onClose = vi.fn();
  renderElementWithTranslatedText(
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>
        <DeletePhotoLinkModal open onClose={onClose} answerId="answer-1" />
      </ApiContext.Provider>
    </QueryClientProvider>,
  );
  return { api, invalidateQueries, onClose };
};

describe('DeletePhotoLinkModal', () => {
  it('deletes the photo and refreshes both chart tables without an encounter', async () => {
    const { api, invalidateQueries, onClose } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Delete image' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.put).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'surveyResponseAnswer/photo/:answerId',
        params: { answerId: 'answer-1' },
      }),
    );
    expect(invalidateQueries).toHaveBeenCalledWith(['encounterCharts']);
    expect(invalidateQueries).toHaveBeenCalledWith(['programRegistryPatientCharts']);
  });
});
