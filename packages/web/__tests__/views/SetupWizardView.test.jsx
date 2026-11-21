import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsContext } from '@tamanu/ui-components';
import { renderElementWithTranslatedText } from '../helpers/render';

const mocks = vi.hoisted(() => ({
  calls: [],
  post: null,
}));

vi.mock('@tanstack/react-query', async importOriginal => ({
  ...(await importOriginal()),
  useQueryClient: () => ({
    invalidateQueries: async key => void mocks.calls.push({ invalidated: key }),
  }),
}));
vi.mock('../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useApi: () => ({ post: (...args) => mocks.post(...args) }),
}));
vi.mock('../../app/utils', async importOriginal => ({
  ...(await importOriginal()),
  notifySuccess: vi.fn(),
}));

const { SetupWizardView } = await import('../../app/views/SetupWizardView');

// spec: FSETUP#setup-wizard
describe('SetupWizardView', () => {
  afterEach(() => {
    cleanup();
    mocks.calls.length = 0;
  });

  const fillAndSubmit = async () => {
    const user = userEvent.setup();
    renderElementWithTranslatedText(
      <SettingsContext.Provider value={{ getSetting: () => undefined }}>
        <SetupWizardView />
      </SettingsContext.Provider>,
    );
    await user.type(screen.getByLabelText(/Central server URL/), 'https://central.example.com');
    await user.type(screen.getByLabelText(/Administrator username/), ' admin@example.com ');
    await user.type(screen.getByLabelText(/Administrator password/), 'sup3r-secret-pw');
    await user.type(screen.getByLabelText(/Facility ID/), 'facility-a');
    await user.click(screen.getByRole('button', { name: 'Connect and continue' }));
  };

  it('leaves the wizard once setup succeeds, by refreshing the server status', async () => {
    mocks.post = vi.fn(async () => ({ configured: true }));

    await fillAndSubmit();

    await waitFor(() => expect(mocks.calls).toEqual([{ invalidated: ['serverAlive'] }]));
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.post).toHaveBeenCalledWith(
      'public/setup/sync',
      expect.objectContaining({ email: 'admin@example.com' }),
      expect.anything(),
    );
  });

  it('stays on the wizard when setup fails', async () => {
    mocks.post = vi.fn(async () => {
      throw new Error('Could not log in to the central server with the new sync credentials');
    });

    await fillAndSubmit();

    expect(
      await screen.findByText(
        'Could not log in to the central server with the new sync credentials',
      ),
    ).toBeTruthy();
    expect(mocks.calls).toEqual([]);
  });
});
